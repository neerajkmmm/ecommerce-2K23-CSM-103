// Matches the seed table in docs/SPRINT_2.md §6.
// Grey/L of the hoodie is intentionally never created (CAT04: a missing
// combination is absent, not a fake zero-stock SKU). CAP-LOGO-OS is a real
// SKU row with stock 0 on a still-draft product — a genuine out-of-stock
// SKU, contrasted with Grey/L's outright absence.
const pool = require('../src/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apparel = await client.query(
      `INSERT INTO categories (name, slug) VALUES ('Apparel', 'apparel') RETURNING id`
    );
    const apparelId = apparel.rows[0].id;

    const hoodies = await client.query(
      `INSERT INTO categories (name, slug, parent_id) VALUES ('Hoodies', 'hoodies', $1) RETURNING id`,
      [apparelId]
    );
    const hoodiesId = hoodies.rows[0].id;

    const tshirts = await client.query(
      `INSERT INTO categories (name, slug, parent_id) VALUES ('T-Shirts', 't-shirts', $1) RETURNING id`,
      [apparelId]
    );
    const tshirtsId = tshirts.rows[0].id;

    const accessories = await client.query(
      `INSERT INTO categories (name, slug) VALUES ('Accessories', 'accessories') RETURNING id`
    );
    const accessoriesId = accessories.rows[0].id;

    const hoodie = await client.query(
      `INSERT INTO products (name, slug, category_id, description, status, specifications)
       VALUES ('Classic Crew Hoodie', 'classic-crew-hoodie', $1, 'Midweight fleece crew hoodie.', 'active', $2)
       RETURNING id`,
      [hoodiesId, JSON.stringify({ material: 'cotton-poly blend', fit: 'regular' })]
    );
    const hoodieId = hoodie.rows[0].id;

    const tee = await client.query(
      `INSERT INTO products (name, slug, category_id, description, status)
       VALUES ('Essential Tee', 'essential-tee', $1, 'Everyday cotton crew-neck tee.', 'active')
       RETURNING id`,
      [tshirtsId]
    );
    const teeId = tee.rows[0].id;

    const cap = await client.query(
      `INSERT INTO products (name, slug, category_id, description, status)
       VALUES ('Logo Snapback Cap', 'logo-snapback-cap', $1, 'Adjustable snapback with embroidered logo.', 'draft')
       RETURNING id`,
      [accessoriesId]
    );
    const capId = cap.rows[0].id;

    const hoodieVariants = [
      { options: { color: 'Black', size: 'M' }, sku: 'HOODIE-BLK-M', price: 45.0, stock: 20 },
      { options: { color: 'Black', size: 'L' }, sku: 'HOODIE-BLK-L', price: 45.0, stock: 15 },
      { options: { color: 'Grey', size: 'M' }, sku: 'HOODIE-GRY-M', price: 45.0, stock: 10 },
      // Grey / L intentionally omitted.
    ];

    for (const v of hoodieVariants) {
      const variant = await client.query(
        `INSERT INTO variants (product_id, option_values) VALUES ($1, $2) RETURNING id`,
        [hoodieId, JSON.stringify(v.options)]
      );
      await client.query(
        `INSERT INTO skus (variant_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)`,
        [variant.rows[0].id, v.sku, v.price, v.stock]
      );
    }

    const teeVariant = await client.query(
      `INSERT INTO variants (product_id, option_values) VALUES ($1, $2) RETURNING id`,
      [teeId, JSON.stringify({ size: 'M' })]
    );
    await client.query(
      `INSERT INTO skus (variant_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)`,
      [teeVariant.rows[0].id, 'TEE-ESSENTIAL-M', 22.0, 30]
    );

    const capVariant = await client.query(
      `INSERT INTO variants (product_id, option_values) VALUES ($1, $2) RETURNING id`,
      [capId, JSON.stringify({ size: 'One Size' })]
    );
    await client.query(
      `INSERT INTO skus (variant_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)`,
      [capVariant.rows[0].id, 'CAP-LOGO-OS', 18.0, 0]
    );

    await client.query('COMMIT');
    console.log('Seed data inserted: 4 categories, 3 products, 5 SKUs (1 combination intentionally absent).');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
