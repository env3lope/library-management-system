const { Router } = require('express')
const bcrypt = require('bcrypt')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = Router()
router.use(requireAuth)
const canManage = requireRole('admin')

function parseUser(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  if (!name || name.length > 120) {
    return { error: 'Ім’я читача обов’язкове (до 120 символів).' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
    return { error: 'Укажіть коректну електронну адресу.' }
  }

  if (phone.length > 30) {
    return { error: 'Номер телефону має містити до 30 символів.' }
  }

  return { name, email, phone: phone || null }
}

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'reader') {
      const [[user]] = await pool.execute(
        `SELECT id, name, email, phone, role
         FROM users WHERE id = ? AND role = 'reader'`,
        [req.user.id],
      )

      return res.json({ users: user ? [user] : [] })
    }

    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const where = search ? 'AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)' : ''
    const parameters = search ? Array(3).fill(`%${search}%`) : []
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.role,
        COUNT(CASE WHEN r.status = 'active' THEN 1 END) AS activeReservations
       FROM users u
       LEFT JOIN reservations r ON r.user_id = u.id
       WHERE u.role = 'reader' ${where}
       GROUP BY u.id
       ORDER BY u.name`,
      parameters,
    )

    return res.json({ users })
  } catch (error) {
    return next(error)
  }
})

router.post('/', canManage, async (req, res, next) => {
  const user = parseUser(req.body)
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (user.error) {
    return res.status(400).json({ message: user.error })
  }

  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ message: 'Пароль читача має містити від 12 до 128 символів.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'reader')`,
      [user.name, user.email, passwordHash, user.phone],
    )

    return res.status(201).json({ id: result.insertId })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id', canManage, async (req, res, next) => {
  const id = Number(req.params.id)
  const user = parseUser(req.body)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор читача.' })
  }

  if (user.error) {
    return res.status(400).json({ message: user.error })
  }

  try {
    const [result] = await pool.execute(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ? AND role = 'reader'",
      [user.name, user.email, user.phone, id],
    )

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Читача не знайдено.' })
    }

    return res.json({ message: 'Дані читача оновлено.' })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', canManage, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор читача.' })
  }

  try {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ? AND role = 'reader'", [id])

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Читача не знайдено.' })
    }

    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
})

module.exports = router
