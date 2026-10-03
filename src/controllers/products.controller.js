const pool = require('../db');
const { AppError } = require('../utils/errors');

async function createProduct(req, res, next) {
  try {
    const { name, slug, category_id, description, specifications } = req.body;
    if (!name || !slug || !category_id) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'name, slug, and category_id are required.')
      );
    }

    const category = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (category.rows.length === 0) {
      return next(new AppError(422, 'INVALID_CATEGORY', 'category_id does not exist.'));
    }

    if (
      specifications !== undefined &&
      (typeof specifications !== 'object' || Array.isArray(specifications))
    ) {
      return next(
        new AppError(422, 'INVALID_SPECIFICATIONS', 'specifications must be a JSON object.')
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO products (name, slug, category_id, description, specifications)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, category_id, status`,
      [
        name,
        slug,
        category_id,
        description || null,
        specifications ? JSON.stringify(specifications) : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, category_id, description, status, specifications } = req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return next(new AppError(404, 'NOT_FOUND', 'Product not found.'));
    }
    const current = existing.rows[0];

    // CAT02/§5 Q1: a product can't go active without a sellable SKU.
    if (status === 'active') {
      const sellable = await pool.query(
        `SELECT s.id FROM skus s
         JOIN variants v ON v.id = s.variant_id
         WHERE v.product_id = $1 AND s.is_active = true
         LIMIT 1`,
        [id]
      );
      if (sellable.rows.length === 0) {
        return next(
          new AppError(422, 'NO_SELLABLE_SKU', 'Cannot activate a product with no active SKU.')
        );
      }
    }

    const { rows } = await pool.query(
      `UPDATE products SET
         name = $1, slug = $2, category_id = $3, description = $4, status = $5,
         specifications = $6, updated_at = now()
       WHERE id = $7
       RETURNING id, name, slug, category_id, status, updated_at`,
      [
        name ?? current.name,
        slug ?? current.slug,
        category_id ?? current.category_id,
        description !== undefined ? description : current.description,
        status ?? current.status,
        specifications !== undefined ? JSON.stringify(specifications) : current.specifications,
        id,
      ]
    );
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.slug, p.status, p.category_id,
              COUNT(s.id)::int AS sku_count
       FROM products p
       LEFT JOIN variants v ON v.product_id = p.id
       LEFT JOIN skus s ON s.variant_id = v.id
       GROUP BY p.id
       ORDER BY p.id`
    );
    res.status(200).json({ products: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProduct, updateProduct, listProducts };
