const fs = require('fs/promises')
const path = require('path')
const sharp = require('sharp')

const IMAGE_ROOT = path.join(__dirname, '..')
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const getFileData = async (fileUrl) => {
  const filePath = path.join(IMAGE_ROOT, fileUrl.replace(/^\//, ''))
  const buffer = await fs.readFile(filePath)
  const extension = path.extname(filePath).toLowerCase()
  if (extension !== '.pdf') {
    // Keep image-analysis requests small and consistent. This runs at analysis
    // time, so reports uploaded before this change are fixed automatically.
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer()
    return { filePath, mimeType: 'image/jpeg', data: `data:image/jpeg;base64,${optimized.toString('base64')}` }
  }
  return { filePath, mimeType: 'application/pdf', data: `data:application/pdf;base64,${buffer.toString('base64')}` }
}

const parseAnalysis = (raw) => {
  const cleaned = raw?.replace(/^```json\s*|^```\s*|\s*```$/g, '').trim()
  if (!cleaned) throw new Error('AI provider returned no analysis')
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error('AI provider returned invalid analysis JSON')
  }
}

const analyzeWithGemini = async (report) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured')

  const parts = [{
    text: `Analyze the attached crop-loss images. The farmer reported crop type: ${report.cropType}. Return only valid JSON with this shape: {"cropType":"string","damageType":"string","estimatedDamagePercent":number,"confidence":number,"observations":["string"],"recommendation":"string"}. Do not claim certainty; this is decision support for an officer.`
  }]

  // One clear field photo is enough for an initial damage assessment. Sending
  // several full-size photos together can exceed shared Gemini capacity.
  for (const image of (report.images || []).slice(0, 1)) {
    const file = await getFileData(image)
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data.split(',')[1] } })
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  // Set GEMINI_FALLBACK_MODEL only to a model confirmed for this API account.
  // An empty default prevents a retired model from adding a misleading error.
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || ''
  const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))]
  // Retry temporary 503s on the current model. If that model is busy or its
  // quota is exhausted, try the configured fallback before returning an error.
  let response
  let modelUsed = primaryModel
  for (const model of models) {
    modelUsed = model
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      })
      const responsePreview = response.ok ? '' : await response.clone().text()
      const isBusy = response.status === 503 || /\b503\b|\bUNAVAILABLE\b|high demand/i.test(responsePreview)
      const isQuota = response.status === 429 || /quota|rate limit|resource_exhausted/i.test(responsePreview)
      if (response.ok || (!isBusy && !isQuota)) break
      if (attempt < 2) await wait(1000 * (attempt + 1))
      if (isQuota) break
    }
    if (response?.ok) break
    const responsePreview = response ? await response.clone().text() : ''
    const isBusy = response?.status === 503 || /\b503\b|\bUNAVAILABLE\b|high demand/i.test(responsePreview)
    const isQuota = response?.status === 429 || /quota|rate limit|resource_exhausted/i.test(responsePreview)
    if (!isBusy && !isQuota) break
  }

  if (!response.ok) {
    const providerMessage = await response.text()
    // Some Gemini gateway responses wrap the actual 503/UNAVAILABLE error in
    // a different HTTP status. Treat both forms as a temporary busy state.
    if (response.status === 503 || /\b503\b|\bUNAVAILABLE\b|high demand/i.test(providerMessage)) {
      throw new Error('AI analysis is temporarily busy. Please wait a minute and try again.')
    }
    if (response.status === 429 || /quota|rate limit|resource_exhausted/i.test(providerMessage)) {
      throw new Error(`Gemini quota is exhausted for the configured models (${models.join(', ')}). Wait for quota reset or enable billing in Google AI Studio.`)
    }
    throw new Error(`Gemini provider returned ${response.status}: ${providerMessage.slice(0, 240)}`)
  }
  const data = await response.json()
  const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  return { ...parseAnalysis(raw), provider: modelUsed, analyzedAt: new Date() }
}

const analyzeReportImages = async (report) => {
  if (!report.images?.length) {
    throw new Error('At least one crop image is required for AI analysis')
  }

  if ((process.env.AI_PROVIDER || 'openai').toLowerCase() === 'gemini') {
    return analyzeWithGemini(report)
  }

  if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY is not configured')

  const content = [
    {
      type: 'input_text',
      text: `Analyze the attached crop-loss images. The farmer reported crop type: ${report.cropType}. Return only valid JSON with this shape: {"cropType":"string","damageType":"string","estimatedDamagePercent":number,"confidence":number,"observations":["string"],"recommendation":"string"}. Do not claim certainty; this is decision support for an officer.`
    }
  ]

  for (const image of (report.images || []).slice(0, 1)) {
    const file = await getFileData(image)
    content.push({ type: 'input_image', image_url: file.data, detail: 'low' })
  }

  const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      input: [{ role: 'user', content }]
    })
  })

  if (!response.ok) {
    const providerMessage = await response.text()
    if (response.status === 429) {
      throw new Error('AI analysis is temporarily unavailable because the AI account has no credits remaining. Add API credits and try again.')
    }
    throw new Error(`AI provider returned ${response.status}: ${providerMessage.slice(0, 240)}`)
  }
  const data = await response.json()
  const parsed = parseAnalysis(data.output_text)

  return {
    ...parsed,
    provider: process.env.AI_MODEL || 'gpt-4o-mini',
    analyzedAt: new Date()
  }
}

module.exports = { analyzeReportImages }
