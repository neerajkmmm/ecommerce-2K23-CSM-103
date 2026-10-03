const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, field: err.field },
    });
  }

  // Postgres unique_violation
  if (err.code === '23505') {
    const field =
      err.constraint && err.constraint.includes('sku_code')
        ? 'sku_code'
        : err.constraint && err.constraint.includes('slug')
        ? 'slug'
        : undefined;
    return res.status(409).json({
      error: {
        code: field === 'sku_code' ? 'DUPLICATE_SKU_CODE' : 'DUPLICATE_SLUG',
        message: `Duplicate value violates a unique constraint (${err.constraint}).`,
        field,
      },
    });
  }

  // Postgres check_violation (e.g. negative stock/price)
  if (err.code === '23514') {
    return res.status(422).json({
      error: { code: 'CHECK_VIOLATION', message: err.message },
    });
  }

  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res.status(422).json({
      error: { code: 'INVALID_REFERENCE', message: err.message },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  });
}

module.exports = { errorHandler };
