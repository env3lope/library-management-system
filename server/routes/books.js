const { Router } = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = Router()
router.use(requireAuth)
const canManage = requireRole('admin')

function parseNames(value) {
  if (value == null || value === '') {
    return { values: [] }
  }

  if (typeof value !== 'string') {
    return { error: 'Список авторів і жанрів має бути текстом.' }
  }

  const values = [...new Set(value.split(',').map((name) => name.trim()).filter(Boolean))]
  if (values.length > 12 || values.some((name) => name.length > 120)) {
    return { error: 'Укажіть не більше 12 назв, кожна до 120 символів.' }
  }

  return { values }
}

function parseBook(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const publisher = typeof body.publisher === 'string' ? body.publisher.trim() : ''
  const totalCopies = Number(body.totalCopies)
  const publicationYear = body.publicationYear === '' || body.publicationYear == null
    ? null
    : Number(body.publicationYear)
  const authors = parseNames(body.authors)
  const genres = parseNames(body.genres)

  if (!title || title.length > 180) {
    return { error: 'Назва книги обов’язкова (до 180 символів).' }
  }

  if (description.length > 5000 || publisher.length > 180) {
    return { error: 'Перевірте довжину опису та назви видавництва.' }
  }

  if (!Number.isInteger(totalCopies) || totalCopies < 1 || totalCopies > 10000) {
    return { error: 'Кількість примірників має бути від 1 до 10 000.' }
  }

  if (publicationYear !== null && (!Number.isInteger(publicationYear) || publicationYear < 1 || publicationYear > 9999)) {
    return { error: 'Вкажіть коректний рік видання.' }
  }

  if (authors.error || genres.error) {
    return { error: authors.error || genres.error }
  }

  return {
    title,
    description: description || null,
    publisher: publisher || null,
    publicationYear,
    totalCopies,
    authors: authors.values,
    genres: genres.values,
  }
}

async function setRelations(connection, kind, values, bookId) {
  const tableName = kind === 'authors' ? 'authors' : 'genres'
  const linkTable = kind === 'authors' ? 'book_authors' : 'book_genres'
  const linkColumn = kind === 'authors' ? 'author_id' : 'genre_id'

  await connection.execute(`DELETE FROM ${linkTable} WHERE book_id = ?`, [bookId])
  for (const name of values) {
    await connection.execute(
      `INSERT INTO ${tableName} (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [name],
    )

    const [[record]] = await connection.execute(`SELECT id FROM ${tableName} WHERE name = ?`, [name])
    await connection.execute(
      `INSERT INTO ${linkTable} (book_id, ${linkColumn}) VALUES (?, ?)`,
      [bookId, record.id],
    )
  }
}

router.get('/', async (req, res, next) => {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    const where = search
      ? `WHERE b.id IN (
          SELECT DISTINCT matches.id FROM books matches
          LEFT JOIN book_authors match_ba ON match_ba.book_id = matches.id
          LEFT JOIN authors a ON a.id = match_ba.author_id
          LEFT JOIN book_genres match_bg ON match_bg.book_id = matches.id
          LEFT JOIN genres g ON g.id = match_bg.genre_id
          WHERE matches.title LIKE ? OR matches.description LIKE ? OR matches.publisher LIKE ?
            OR a.name LIKE ? OR g.name LIKE ?
        )`
      : ''

    const parameters = search ? Array(5).fill(`%${search}%`) : []

    const [books] = await pool.execute(
      `SELECT b.id, b.title, b.description, b.publication_year AS publicationYear,
        b.publisher, b.total_copies AS totalCopies,
        COALESCE(reserved.active_count, 0) AS reservedCopies,
        GREATEST(b.total_copies - COALESCE(reserved.active_count, 0), 0) AS availableCopies,
        COALESCE(author_list.names, '') AS authors,
        COALESCE(genre_list.names, '') AS genres
       FROM books b
       LEFT JOIN (
         SELECT book_id, COUNT(*) AS active_count
         FROM reservations WHERE status IN ('active', 'fulfilled')
         GROUP BY book_id
       ) reserved ON reserved.book_id = b.id
       LEFT JOIN (
         SELECT ba.book_id, GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS names
         FROM book_authors ba JOIN authors a ON a.id = ba.author_id
         GROUP BY ba.book_id
       ) author_list ON author_list.book_id = b.id
       LEFT JOIN (
         SELECT bg.book_id, GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS names
         FROM book_genres bg JOIN genres g ON g.id = bg.genre_id
         GROUP BY bg.book_id
       ) genre_list ON genre_list.book_id = b.id
       ${where}
       ORDER BY b.title`,
      parameters,
    )

    return res.json({ books })
  } catch (error) {
    return next(error)
  }
})

router.post('/', canManage, async (req, res, next) => {
  const book = parseBook(req.body)

  if (book.error) {
    return res.status(400).json({ message: book.error })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [result] = await connection.execute(
      `INSERT INTO books (title, description, publication_year, publisher, total_copies)
       VALUES (?, ?, ?, ?, ?)`,
      [book.title, book.description, book.publicationYear, book.publisher, book.totalCopies],
    )

    await setRelations(connection, 'authors', book.authors, result.insertId)
    await setRelations(connection, 'genres', book.genres, result.insertId)
    await connection.commit()

    return res.status(201).json({ id: result.insertId })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

router.put('/:id', canManage, async (req, res, next) => {
  const id = Number(req.params.id)
  const book = parseBook(req.body)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор книги.' })
  }

  if (book.error) {
    return res.status(400).json({ message: book.error })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute('SELECT id FROM books WHERE id = ? FOR UPDATE', [id])

    if (!rows[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Книгу не знайдено.' })
    }

    const [[count]] = await connection.execute(
      "SELECT COUNT(*) AS reservedCount FROM reservations WHERE book_id = ? AND status IN ('active', 'fulfilled')",
      [id],
    )
    if (book.totalCopies < Number(count.reservedCount)) {
      await connection.rollback()
      return res.status(409).json({ message: 'Кількість примірників не може бути меншою за активні резервування.' })
    }

    await connection.execute(
      `UPDATE books SET title = ?, description = ?, publication_year = ?, publisher = ?, total_copies = ?
       WHERE id = ?`,
      [book.title, book.description, book.publicationYear, book.publisher, book.totalCopies, id],
    )

    await setRelations(connection, 'authors', book.authors, id)
    await setRelations(connection, 'genres', book.genres, id)
    await connection.commit()

    return res.json({ message: 'Книгу оновлено.' })
  } catch (error) {
    await connection.rollback()
    return next(error)
  } finally {
    connection.release()
  }
})

router.delete('/:id', canManage, async (req, res, next) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некоректний ідентифікатор книги.' })
  }

  try {
    const [result] = await pool.execute('DELETE FROM books WHERE id = ?', [id])
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Книгу не знайдено.' })
    }

    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
})

module.exports = router
