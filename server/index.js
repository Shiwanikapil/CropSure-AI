require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')

const app = express()
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const allowedOrigins = new Set([
  clientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
])
app.use(cors({ origin: (origin, callback) => {
  const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517[3-9]$/.test(origin || '')
  if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin) return callback(null, true)
  return callback(new Error('Frontend origin is not allowed'))
} }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const authRoutes = require('./routes/auth')
const reportRoutes = require('./routes/reports')

app.use('/api/auth', authRoutes)
app.use('/api/reports', reportRoutes)

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI

async function start() {
  if (!MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET must be set. Copy .env.example to .env and configure it.')
  }
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const officerId = process.env.OFFICER_ID?.trim()
  const officerPassword = process.env.OFFICER_PASSWORD
  if (officerId && officerPassword) {
    const Officer = require('./models/Officer')
    const bcrypt = require('bcrypt')
    const passwordHash = await bcrypt.hash(officerPassword, 12)
    await Officer.findOneAndUpdate(
      { officerId },
      { name: process.env.OFFICER_NAME?.trim() || 'Review Officer', officerId, passwordHash },
      { upsert: true, new: true, runValidators: true }
    )
    console.log(`Configured officer account is ready: ${officerId}`)
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  console.log(`AI provider configured: ${(process.env.AI_PROVIDER || 'openai').toLowerCase()}`)
}

start().catch((error) => {
  console.error(`Server failed to start: ${error.message}`)
  process.exit(1)
})
