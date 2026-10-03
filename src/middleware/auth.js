const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      new AppError(401, 'UNAUTHENTICATED', 'Missing or malformed Authorization header.')
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return next(new AppError(403, 'FORBIDDEN', 'Admin role required.'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token.'));
  }
}

module.exports = { requireAdmin };
