const { Router } = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = Router()

function createSession(account) {
  const user = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  }

  const token = jwt.sign(
    { name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )

  return { token, user }
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!email || !password) {
      return res.status(400).json({ message: 'Вкажіть електронну пошту та пароль.' })
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email],
    )

    const account = rows[0]
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      return res.status(401).json({ message: 'Неправильна електронна пошта або пароль.' })
    }

    return res.json(createSession(account))
  } catch (error) {
    return next(error)
  }
})

router.post('/register', async (req, res, next) => {
  const body = req.body || {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!name || name.length > 120) {
    return res.status(400).json({ message: 'Вкажіть ім’я (до 120 символів).' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
    return res.status(400).json({ message: 'Укажіть коректну електронну адресу.' })
  }
  if (phone.length > 30) {
    return res.status(400).json({ message: 'Номер телефону має містити до 30 символів.' })
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Пароль має містити від 12 до 128 символів.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'reader')`,
      [name, email, passwordHash, phone || null],
    )
    return res.status(201).json(
      createSession({ id: result.insertId, name, email, role: 'reader' }),
    )
  } catch (error) {
    return next(error)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
