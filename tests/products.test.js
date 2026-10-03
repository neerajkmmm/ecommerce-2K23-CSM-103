require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { adminToken } = require('./helpers/auth');

async function makeCategory(token, slug) {
  const res = await request(app)
    .post('/api/v1/admin/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: slug, slug });
  return res.body.id;
}

describe('Products admin API (CAT02)', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('creates a draft product', async () => {
    const token = adminToken();
    const categoryId = await makeCategory(token, 'products-test-cat');

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Hoodie', slug: 'test-hoodie', category_id: categoryId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
  });

  test('rejects a duplicate product slug', async () => {
    const token = adminToken();
    const categoryId = await makeCategory(token, 'products-test-cat-2');

    await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', slug: 'dup-product-slug', category_id: categoryId });

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup again', slug: 'dup-product-slug', category_id: categoryId });

    expect(res.status).toBe(409);
  });

  test('rejects activating a product with no active SKU (§5 Q1)', async () => {
    const token = adminToken();
    const categoryId = await makeCategory(token, 'products-test-cat-3');

    const product = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No SKU Yet', slug: 'no-sku-yet', category_id: categoryId });

    const res = await request(app)
      .patch(`/api/v1/admin/products/${product.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NO_SELLABLE_SKU');
  });
});
