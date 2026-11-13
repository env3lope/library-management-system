const { Router } = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = Router()
router.use(requireAuth)
const canManage = requireRole('admin')

router.get('/', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'active'
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const conditions = []
    const parameters = []

    if (status !== 'all') {
      if (!['active', 'cancelled', 'fulfilled'].includes(status)) {
        return res.status(400).json({ message: 'Невідомий статус резервування.' })
      }

      conditions.push('r.status = ?')
      parameters.push(status)
    }

    if (req.user.role === 'reader') {
      conditions.push('r.user_id = ?')
      parameters.push(req.user.id)
    }

    if (search) {
      conditions.push('(b.title LIKE ? OR u.name LIKE ?)')
      parameters.push(`%${search}%`, `%${search}%`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [reservations] = await pool.execute(
      `SELECT r.id, r.user_id AS userId, r.book_id AS bookId,
        b.title AS bookTitle, u.name AS userName,
        r.status, r.created_at AS createdAt, r.cancelled_at AS cancelledAt
       FROM reservations r
       JOIN books b ON b.id = r.book_id
       JOIN users u ON u.id = r.user_id
       ${where}
       ORDER BY r.created_at DESC, r.id DESC`,
      parameters,
    )

    return res.json({ reservations })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  const bookId = Number(req.body.bookId)
  const userId = req.user.role === 'reader' ? req.user.id : Number(req.body.userId)
  if (!Number.isInteger(bookId) || bookId < 1 || !Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ message: 'Оберіть книгу та читача.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [bookRows] = await connection.execute(
      'SELECT id, total_copies AS totalCopies FROM books WHERE id = ? FOR UPDATE',
      [bookId],
    )

    if (!bookRows[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Книгу не знайдено.' })
    }

    const [userRows] = await connection.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'reader'",
      [userId],
    )

    if (!userRows[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Читача не знайдено.' })
    }

    const [[count]] = await connection.execute(
      "SELECT COUNT(*) AS reservedCount FROM reservations WHERE book_id = ? AND status IN ('active', 'fulfilled')",
      [bookId],
    )

    if (Number(count.reservedCount) >= Number(bookRows[0].totalCopies)) {
      await connection.rollback()
      return res.status(409).json({ message: 'Усі примірники цієї книги вже зарезервовані.' })
    }

    const [[existing]] = await connection.execute(
      "SELECT id FROM reservations WHERE book_id = ? AND user_id = ? AND status = 'active' LIMIT 1",
      [bookId, userId],
    )

    if (existing) {
      await connection.rollback()
      return res.status(409).json({ message: 'У вас уже є активне резервування цієї книги.' })
    }

    const [result] = await connection.execute(
      "INSERT INTO reservations (user_id, book_id, status) VALUES (?, ?, 'active')",
      [userId, bookId],
    )

    await connection.commit()
    return res.status(201).json({ id: result.insertId })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

router.patch('/:id/cancel', async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор резервування.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute('SELECT user_id AS userId, status FROM reservations WHERE id = ? FOR UPDATE', [id])

    if (!rows[0] || (req.user.role === 'reader' && Number(rows[0].userId) !== req.user.id)) {
      await connection.rollback()
      return res.status(404).json({ message: 'Резервування не знайдено.' })
    }

    if (rows[0].status !== 'active') {
      await connection.rollback()
      return res.status(409).json({ message: 'Скасувати можна лише активне резервування.' })
    }

    await connection.execute(
      "UPDATE reservations SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    )

    await connection.commit()
    return res.json({ message: 'Резервування скасовано.' })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

router.patch('/:id/fulfill', canManage, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор резервування.' })
  }

  try {
    const [result] = await pool.execute(
      "UPDATE reservations SET status = 'fulfilled' WHERE id = ? AND status = 'active'",
      [id],
    )

    if (!result.affectedRows) {
      return res.status(409).json({ message: 'Активне резервування не знайдено.' })
    }

    return res.json({ message: 'Резервування виконано.' })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
