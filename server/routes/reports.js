const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const { auth, requireRole } = require('../middleware/auth')
const Report = require('../models/Report')
const Farmer = require('../models/Farmer')
const { getWeatherEvidence } = require('../services/weather')
const { analyzeReportImages } = require('../services/aiAnalysis')
const { fingerprintFiles, buildIntegrityResult } = require('../services/evidenceIntegrity')
const { createOfficerReportPdf } = require('../services/reportPdf')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const documentTypes = new Set(['application/pdf'])
const upload = multer({
  storage,
  limits: { files: 7, fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'evidence') return cb(new Error('Unexpected upload field'))
    if (!imageTypes.has(file.mimetype) && !documentTypes.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WebP, and PDF files are allowed'))
    }
    cb(null, true)
  }
})

const reportStatuses = ['submitted', 'under_review', 'more_information_needed', 'approved', 'rejected']

// Create report (farmer)
router.post('/', auth, upload.array('evidence', 7), async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can submit reports' })
    const { cropType, damagePercent, description, lat, lng, address } = req.body
    const latitude = Number(lat)
    const longitude = Number(lng)
    const damage = Number(damagePercent)
    if (!cropType?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Crop type and incident description are required' })
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'A valid field location is required' })
    }
    // The assistant is intended for crop-loss reports in India. Reject invalid
    // coordinates instead of allowing a default, empty, or unrelated point.
    if (latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) {
      return res.status(400).json({ message: 'Select the damaged field inside India on the map before submitting.' })
    }
    if (!Number.isFinite(damage) || damage < 0 || damage > 100) {
      return res.status(400).json({ message: 'Damage percentage must be between 0 and 100' })
    }
    const images = (req.files || [])
      .filter(file => imageTypes.has(file.mimetype))
      .map(file => `/uploads/${file.filename}`)
    const documents = (req.files || [])
      .filter(file => documentTypes.has(file.mimetype))
      .map(file => `/uploads/${file.filename}`)
    const fingerprints = await fingerprintFiles(req.files)
    const hashes = fingerprints.map((file) => file.hash)
    const duplicateReports = hashes.length
      ? await Report.find({ 'evidenceIntegrity.fileHashes': { $in: hashes } }).select('_id').lean()
      : []
    let weatherEvidence
    try {
      weatherEvidence = await getWeatherEvidence(latitude, longitude)
    } catch (weatherError) {
      console.warn('Weather evidence unavailable:', weatherError.message)
    }
    const report = new Report({
      farmer: req.user.id,
      cropType: cropType.trim(),
      damagePercent: damage,
      description: description.trim(),
      lat: latitude,
      lng: longitude,
      address: address?.trim(),
      images,
      documents,
      weatherEvidence,
      evidenceIntegrity: buildIntegrityResult(fingerprints, duplicateReports)
    })
    await report.save()
    res.json(report)
  } catch (err) {
    console.error(err)
    if (err instanceof multer.MulterError || err.message.includes('Only ') || err.message === 'Unexpected upload field') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

// Get all reports (officer)
router.get('/', auth, requireRole('officer'), async (req, res) => {
  try {
    const reports = await Report.find().populate('farmer', 'name email').sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get farmer's reports
router.get('/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers' })
    const reports = await Report.find({ farmer: req.user.id }).sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Secure report download: only the report owner can download the officer PDF.
router.get('/:id/officer-report', auth, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can download this report' })
    const report = await Report.findOne({ _id: req.params.id, farmer: req.user.id })
    if (!report?.officerReportPdf) return res.status(404).json({ message: 'The officer PDF is not available yet' })
    const reportPath = path.join(__dirname, '..', 'uploads', 'reports', report.officerReportPdf)
    return res.download(reportPath, `crop-loss-officer-report-${report._id}.pdf`)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Unable to download the officer report' })
  }
})

// Officer explicitly generates the PDF that becomes available to the farmer.
router.post('/:id/officer-report', auth, requireRole('officer'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('farmer', 'name email')
    if (!report) return res.status(404).json({ message: 'Report not found' })
    const pdf = await createOfficerReportPdf(report)
    report.officerReportPdf = pdf.filename
    await report.save()
    return res.json(report)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Unable to generate the officer PDF' })
  }
})

router.post('/:id/analyze', auth, requireRole('officer'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    const aiAnalysis = await analyzeReportImages(report)
    report.aiAnalysis = aiAnalysis
    await report.save()
    res.json(report)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message || 'AI analysis failed' })
  }
})

// Update status (officer)
router.patch('/:id/status', auth, requireRole('officer'), async (req, res) => {
  try {
    const { status, officerNote } = req.body
    if (!reportStatuses.includes(status)) return res.status(400).json({ message: 'Invalid report status' })
    const report = await Report.findById(req.params.id).populate('farmer', 'name email')
    if (!report) return res.status(404).json({ message: 'Report not found' })
    report.status = status
    report.officerNote = typeof officerNote === 'string' ? officerNote.trim().slice(0, 1000) : ''
    report.officerUpdatedAt = new Date()
    const pdf = await createOfficerReportPdf(report)
    report.officerReportPdf = pdf.filename
    await report.save()
    res.json(report)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete a farmer and all of their reports (officer)
router.delete('/farmer/:farmerId', auth, requireRole('officer'), async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.farmerId)
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' })
    const deletedReports = await Report.deleteMany({ farmer: farmer._id })
    res.json({ message: 'Farmer and reports deleted', farmerId: farmer._id, deletedReports: deletedReports.deletedCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to delete farmer' })
  }
})

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message })
  if (error) return res.status(400).json({ message: error.message || 'Unable to upload evidence' })
  next()
})

module.exports = router
