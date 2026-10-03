const pool = require('../db');
const { AppError } = require('../utils/errors');

// Is `candidateAncestorId` a descendant of `categoryId`? Walks candidateAncestorId's
// own parent chain upward and checks whether categoryId shows up in it — if it does,
// assigning candidateAncestorId as categoryId's parent would create a cycle.
async function isDescendant(client, categoryId, candidateAncestorId) {
  const { rows } = await client.query(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id FROM categories WHERE id = $1
       UNION ALL
       SELECT c.id, c.parent_id FROM categories c
       JOIN ancestors a ON c.id = a.parent_id
     )
     SELECT id FROM ancestors WHERE id = $2`,
    [candidateAncestorId, categoryId]
  );
  return rows.length > 0;
}

async function createCategory(req, res, next) {
  try {
    const { name, slug, parent_id } = req.body;
    if (!name || !slug) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'name and slug are required.'));
    }

    if (parent_id) {
      const { rows } = await pool.query('SELECT id FROM categories WHERE id = $1', [parent_id]);
      if (rows.length === 0) {
        return next(new AppError(422, 'INVALID_PARENT', 'parent_id does not exist.'));
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, parent_id) VALUES ($1, $2, $3)
       RETURNING id, name, slug, parent_id, is_active`,
      [name, slug, parent_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  const { id } = req.params;
  const { name, slug, parent_id, is_active } = req.body;

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return next(new AppError(404, 'NOT_FOUND', 'Category not found.'));
    }
    const current = existing.rows[0];

    const nextParentId = parent_id !== undefined ? parent_id : current.parent_id;

    if (nextParentId !== null) {
      if (Number(nextParentId) === Number(id)) {
        return next(new AppError(422, 'INVALID_PARENT', 'A category cannot be its own parent.'));
      }
      const cycle = await isDescendant(client, id, nextParentId);
      if (cycle) {
        return next(new AppError(422, 'INVALID_PARENT', 'parent_id would create a cycle.'));
      }
    }

    const { rows } = await client.query(
      `UPDATE categories SET
         name = $1, slug = $2, parent_id = $3, is_active = $4, updated_at = now()
       WHERE id = $5
       RETURNING id, name, slug, parent_id, is_active, updated_at`,
      [
        name ?? current.name,
        slug ?? current.slug,
        nextParentId,
        is_active !== undefined ? is_active : current.is_active,
        id,
      ]
    );

    // Deactivation never cascades (§5 of docs/SPRINT_2.md) — the admin gets a
    // warning instead so inventory doesn't silently disappear.
    let warning;
    if (is_active === false) {
      const affected = await client.query(
        `SELECT id, name FROM categories WHERE parent_id = $1 AND is_active = true`,
        [id]
      );
      if (affected.rows.length > 0) {
        warning = `${affected.rows.length} active subcategory(ies) were not deactivated automatically.`;
      }
    }

    res.status(200).json(warning ? { ...rows[0], warning } : rows[0]);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
}

async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, slug, parent_id, is_active FROM categories ORDER BY id'
    );

    const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
    const roots = [];
    for (const row of byId.values()) {
      if (row.parent_id && byId.has(row.parent_id)) {
        byId.get(row.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    }

    res.status(200).json({ categories: roots });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCategory, updateCategory, listCategories, isDescendant };
