const mongoose = require('mongoose')

const officerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  officerId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Officer', officerSchema)
