require('dotenv').config()

const express = require('express')
const cors = require('cors')
const pool = require('./db')
const authRoutes = require('./routes/auth')
const booksRoutes = require('./routes/books')
const usersRoutes = require('./routes/users')
const reservationsRoutes = require('./routes/reservations')
const { requireAuth } = require('./middleware/auth')

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Укажіть JWT_SECRET довжиною щонайменше 32 символи.')
}

const app = express()
const port = Number(process.env.PORT)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1')
    return res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/reservations', reservationsRoutes)

app.get('/api/dashboard', requireAuth, async (req, res, next) => {
  try {
    const [[bookStats]] = await pool.query(
      `SELECT COUNT(*) AS titles, COALESCE(SUM(total_copies), 0) AS copies
       FROM books`,
    )

    const [[readerStats]] = await pool.query(
      "SELECT COUNT(*) AS readers FROM users WHERE role = 'reader'",
    )

    const [[reservationStats]] = await pool.query(
      `SELECT COUNT(*) AS activeReservations FROM reservations WHERE status = 'active'`,
    )

    const [[availability]] = await pool.query(
      `SELECT COALESCE(SUM(GREATEST(b.total_copies - COALESCE(r.active_count, 0), 0)), 0) AS availableCopies
       FROM books b
       LEFT JOIN (
         SELECT book_id, COUNT(*) AS active_count
         FROM reservations WHERE status ='active'
         GROUP BY book_id
       ) r ON r.book_id = b.id`,
    )

    const [recentReservations] = await pool.execute(
      `SELECT r.id, b.title AS bookTitle, u.name AS userName,
        r.status, r.created_at AS createdAt
       FROM reservations r
       JOIN books b ON b.id = r.book_id
       JOIN users u ON u.id = r.user_id
       ${req.user.role === 'reader' ? 'WHERE r.user_id = ?' : ''}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 5`,
      req.user.role === 'reader' ? [req.user.id] : [],
    )

    return res.json({
      stats: {
        titles: Number(bookStats.titles),
        copies: Number(bookStats.copies),
        readers: Number(readerStats.readers),
        activeReservations: Number(reservationStats.activeReservations),
        availableCopies: Number(availability.availableCopies),
      },
      recentReservations,
    })

  } catch (error) {
    return next(error)
  }
})

app.use('/api', (req, res) => res.status(404).json({ message: 'Маршрут API не знайдено.' }))

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  console.error(error)

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Користувач із такою електронною адресою вже існує.' })
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'Неможливо видалити запис, на який посилається історія резервувань.' })
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Пов’язану книгу або читача не знайдено.' })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Тіло запиту має містити коректний JSON.' })
  }

  return res.status(500).json({ message: 'Внутрішня помилка сервера.' })
})

const server = app.listen(port, () => {
  console.log(`API бібліотеки працює на http://localhost:${port}`)
})

function shutdown() {
  server.close(() => {
    pool.end().then(() => process.exit(0)).catch((error) => {
      console.error('Failed to close the database pool:', error)
      process.exit(1)
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
