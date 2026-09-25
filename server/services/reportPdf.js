const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const reportsDirectory = path.join(__dirname, '..', 'uploads', 'reports')

const value = (input, fallback = 'Not available') => input === undefined || input === null || input === '' ? fallback : String(input)
const date = (input) => input ? new Date(input).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available'

function section(document, heading) {
  document.moveDown(.8).fillColor('#166534').font('Helvetica-Bold').fontSize(13).text(heading)
  document.moveDown(.25).moveTo(50, document.y).lineTo(545, document.y).strokeColor('#bbf7d0').stroke()
  document.moveDown(.45).fillColor('#1f2937').font('Helvetica').fontSize(10)
}

function line(document, label, content) {
  document.font('Helvetica-Bold').text(`${label}: `, { continued: true })
  document.font('Helvetica').text(value(content))
}

async function createOfficerReportPdf(report) {
  await fs.promises.mkdir(reportsDirectory, { recursive: true })
  const filename = `officer-report-${report._id}-${Date.now()}.pdf`
  const outputPath = path.join(reportsDirectory, filename)

  await new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Crop Loss Officer Report', Author: 'CropSure AI' } })
    const output = fs.createWriteStream(outputPath)
    document.pipe(output)
    output.on('finish', resolve)
    output.on('error', reject)

    document.rect(0, 0, 595, 92).fill('#14532d')
    document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('CropSure AI', 50, 28)
    document.font('Helvetica').fontSize(11).text('Officer Crop Loss Review Report', 50, 57)
    document.fillColor('#64748b').fontSize(9).text(`Generated on ${date(new Date())}`, 50, 111)

    section(document, 'Farmer and Report Details')
    line(document, 'Farmer name', report.farmer?.name)
    line(document, 'Farmer email', report.farmer?.email)
    line(document, 'Report ID', report._id)
    line(document, 'Crop', report.cropType)
    line(document, 'Estimated damage', `${value(report.damagePercent, '0')}%`)
    line(document, 'Report submitted', date(report.createdAt))
    line(document, 'Field location', report.address || `${report.lat}, ${report.lng}`)
    line(document, 'Coordinates', `${report.lat}, ${report.lng}`)
    document.font('Helvetica-Bold').text('Farmer description:')
    document.font('Helvetica').text(value(report.description), { lineGap: 3 })

    if (report.weatherEvidence) {
      section(document, 'Weather Evidence')
      line(document, 'Observed at', date(report.weatherEvidence.observedAt))
      line(document, 'Temperature', `${value(report.weatherEvidence.temperatureC)} C`)
      line(document, 'Rainfall', `${value(report.weatherEvidence.precipitationMm)} mm`)
      line(document, 'Wind speed', `${value(report.weatherEvidence.windSpeedKmh)} km/h`)
    }

    section(document, 'AI Analysis')
    if (report.aiAnalysis) {
      line(document, 'Damage type', report.aiAnalysis.damageType)
      line(document, 'AI estimated damage', `${value(report.aiAnalysis.estimatedDamagePercent)}%`)
      line(document, 'Confidence', report.aiAnalysis.confidence === undefined ? undefined : `${Math.round(report.aiAnalysis.confidence * 100)}%`)
      line(document, 'Recommendation', report.aiAnalysis.recommendation)
      if (report.aiAnalysis.observations?.length) line(document, 'Observations', report.aiAnalysis.observations.join('; '))
    } else {
      document.text('AI analysis has not been completed for this report.')
    }

    section(document, 'Officer Decision')
    line(document, 'Current status', value(report.status).replaceAll('_', ' '))
    line(document, 'Officer updated', date(report.officerUpdatedAt))
    document.font('Helvetica-Bold').text('Officer note:')
    document.font('Helvetica').text(value(report.officerNote, 'No officer note has been added.'), { lineGap: 3 })

    document.fontSize(8).fillColor('#64748b').text('This report is generated for the farmer record and officer review.', 50, 780, { width: 495, align: 'center' })
    document.end()
  })

  return { filename, outputPath }
}

module.exports = { createOfficerReportPdf }
