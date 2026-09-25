const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  cropType: { type: String },
  damagePercent: { type: Number, min: 0, max: 100 },
  description: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  address: { type: String },
  images: [{ type: String }],
  documents: [{ type: String }],
  weatherEvidence: {
    provider: String,
    observedAt: Date,
    temperatureC: Number,
    humidityPercent: Number,
    precipitationMm: Number,
    windSpeedKmh: Number,
    weatherCode: Number
  },
  aiAnalysis: {
    cropType: String,
    damageType: String,
    estimatedDamagePercent: Number,
    confidence: Number,
    observations: [String],
    recommendation: String,
    provider: String,
    analyzedAt: Date
  },
  evidenceIntegrity: {
    provider: String,
    riskLevel: String,
    duplicateCount: Number,
    flags: [String],
    fileHashes: [String],
    fingerprints: [{
      hash: String,
      originalName: String,
      mimeType: String,
      size: Number
    }],
    checkedAt: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'more_information_needed', 'approved', 'rejected'],
    default: 'submitted'
  },
  officerNote: { type: String, default: '' },
  officerUpdatedAt: { type: Date },
  officerReportPdf: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Report', reportSchema)
