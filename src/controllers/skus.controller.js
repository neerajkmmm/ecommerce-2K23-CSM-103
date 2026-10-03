const pool = require('../db');
const { AppError } = require('../utils/errors');

// SKUs are created under a product rather than a separate /variants endpoint:
// callers may pass an existing variant_id, or an option_values object, in which
// case a matching variant is reused or created in the same transaction. See
// docs/SPRINT_2.md §4 for the rationale.
async function createSku(req, res, next) {
  const { id: productId } = req.params;
  const { variant_id, option_values, sku_code, price, stock_quantity } = req.body;

  if (!sku_code || price === undefined || price === null) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'sku_code and price are required.'));
  }
  if (Number(price) < 0) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'price cannot be negative.'));
  }

  const client = await pool.connect();
  try {
    const product = await client.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (product.rows.length === 0) {
      return next(new AppError(422, 'INVALID_PRODUCT', 'product does not exist.'));
    }

    await client.query('BEGIN');

    let resolvedVariantId = variant_id;

    if (!resolvedVariantId) {
      if (!option_values || typeof option_values !== 'object') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Provide variant_id or option_values.');
      }
      const existingVariant = await client.query(
        `SELECT id FROM variants WHERE product_id = $1 AND option_values::text = $2::text`,
        [productId, JSON.stringify(option_values)]
      );
      if (existingVariant.rows.length > 0) {
        resolvedVariantId = existingVariant.rows[0].id;
      } else {
        const created = await client.query(
          `INSERT INTO variants (product_id, option_values) VALUES ($1, $2) RETURNING id`,
          [productId, JSON.stringify(option_values)]
        );
        resolvedVariantId = created.rows[0].id;
      }
    }

    const { rows } = await client.query(
      `INSERT INTO skus (variant_id, sku_code, price, stock_quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, variant_id, sku_code, price, stock_quantity, is_active`,
      [resolvedVariantId, sku_code, price, stock_quantity ?? 0]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function updateSku(req, res, next) {
  try {
    const { id } = req.params;
    const { price, stock_quantity, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM skus WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return next(new AppError(404, 'NOT_FOUND', 'SKU not found.'));
    }
    const current = existing.rows[0];

    const nextStock = stock_quantity !== undefined ? stock_quantity : current.stock_quantity;
    if (nextStock < 0) {
      return next(new AppError(422, 'NEGATIVE_STOCK', 'stock_quantity cannot go below 0.'));
    }

    const { rows } = await pool.query(
      `UPDATE skus SET
         price = $1, stock_quantity = $2, is_active = $3, updated_at = now()
       WHERE id = $4
       RETURNING id, price, stock_quantity, is_active, updated_at`,
      [price ?? current.price, nextStock, is_active !== undefined ? is_active : current.is_active, id]
    );
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { createSku, updateSku };
