require('dotenv').config()
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const Officer = require('../models/Officer')

async function createOfficer() {
  const [name, officerId, password] = process.argv.slice(2)
  if (!name || !officerId || !password) {
    throw new Error('Usage: npm run create-officer -- "Name" officer-id secure-password')
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured in .env')
  await mongoose.connect(process.env.MONGO_URI)
  const passwordHash = await bcrypt.hash(password, 12)
  await Officer.findOneAndUpdate({ officerId }, { name, officerId, passwordHash }, { upsert: true, new: true, runValidators: true })
  console.log(`Officer ${officerId} created or updated.`)
  await mongoose.disconnect()
}

createOfficer().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect()
  process.exit(1)
})
