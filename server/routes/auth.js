const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Farmer = require('../models/Farmer')
const Officer = require('../models/Officer')

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
)

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' })
  try {
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await Farmer.findOne({ email: normalizedEmail })
    if (existing) return res.status(400).json({ message: 'Email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const farmer = await Farmer.create({ name: name.trim(), email: normalizedEmail, phone: phone?.trim(), passwordHash: hash })
    farmer.role = 'farmer'
    const token = signToken(farmer)
    res.json({ token, farmer: { id: farmer._id, name: farmer.name, email: farmer.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' })
  try {
    const farmer = await Farmer.findOne({ email: email.trim().toLowerCase() })
    if (!farmer) return res.status(400).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, farmer.passwordHash)
      || (password.trim() !== password && await bcrypt.compare(password.trim(), farmer.passwordHash))
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' })
    farmer.role = 'farmer'
    const token = signToken(farmer)
    res.json({ token, farmer: { id: farmer._id, name: farmer.name, email: farmer.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/officer-login', async (req, res) => {
  const { officerId, password } = req.body
  if (!officerId || !password) return res.status(400).json({ message: 'Missing fields' })

  try {
    const officer = await Officer.findOne({ officerId: officerId.trim() })

    if (!officer) return res.status(400).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, officer.passwordHash)
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' })

    officer.role = 'officer'
    const token = signToken(officer)
    res.json({ token, officer: { id: officer._id, name: officer.name, officerId: officer.officerId } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
