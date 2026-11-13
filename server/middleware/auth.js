const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Потрібно увійти до системи.' })
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: Number(claims.sub),
      name: claims.name,
      email: claims.email,
      role: claims.role,
    }
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Сесія завершилася. Увійдіть знову.' })
    }
    return next(error)
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостатньо прав для цієї дії.' })
    }
    return next()
  }
}

module.exports = { requireAuth, requireRole }
