require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { adminToken } = require('./helpers/auth');

async function makeProduct(token) {
  const slugBase = `sku-test-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const category = await request(app)
    .post('/api/v1/admin/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: slugBase, slug: `cat-${slugBase}` });

  const product = await request(app)
    .post('/api/v1/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'SKU Test Product', slug: `prod-${slugBase}`, category_id: category.body.id });

  return product.body.id;
}

describe('SKUs admin API (CAT03 / CAT04 / CAT05)', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('creates a SKU and its variant in one call', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);

    const res = await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        option_values: { color: 'Black', size: 'M' },
        sku_code: `SKU-${Date.now()}`,
        price: 45.0,
        stock_quantity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.stock_quantity).toBe(10);
  });

  test('rejects a negative price', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);

    const res = await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'M' }, sku_code: `SKU-${Date.now()}`, price: -5 });

    expect(res.status).toBe(400);
  });

  test('rejects a duplicate sku_code', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);
    const code = `SKU-DUP-${Date.now()}`;

    await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'S' }, sku_code: code, price: 10 });

    const res = await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'M' }, sku_code: code, price: 10 });

    expect(res.status).toBe(409);
  });

  test('rejects an update that would take stock below 0 (API level)', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);

    const sku = await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'L' }, sku_code: `SKU-NEG-${Date.now()}`, price: 10, stock_quantity: 2 });

    const res = await request(app)
      .patch(`/api/v1/admin/skus/${sku.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_quantity: -1 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NEGATIVE_STOCK');
  });

  test('the database itself rejects negative stock, independent of the API (CAT05)', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);

    const sku = await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'XL' }, sku_code: `SKU-DB-${Date.now()}`, price: 10, stock_quantity: 1 });

    await expect(
      pool.query('UPDATE skus SET stock_quantity = -1 WHERE id = $1', [sku.body.id])
    ).rejects.toThrow();
  });

  test('a missing combination is never returned as a zero-stock SKU (CAT04)', async () => {
    const token = adminToken();
    const productId = await makeProduct(token);

    await request(app)
      .post(`/api/v1/admin/products/${productId}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { color: 'Black', size: 'M' }, sku_code: `SKU-ONLY-${Date.now()}`, price: 10 });

    const { rows } = await pool.query(
      `SELECT v.option_values FROM skus s
       JOIN variants v ON v.id = s.variant_id
       WHERE v.product_id = $1`,
      [productId]
    );

    expect(rows.length).toBe(1);
    expect(rows.some((r) => r.option_values.color === 'Grey')).toBe(false);
  });
});
