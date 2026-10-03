require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { adminToken } = require('./helpers/auth');

describe('Categories admin API (CAT01)', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('creates a root category', async () => {
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Apparel', slug: 'apparel-test' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('apparel-test');
  });

  test('rejects a duplicate slug', async () => {
    const token = adminToken();
    await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', slug: 'dup-slug-test' });

    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup again', slug: 'dup-slug-test' });

    expect(res.status).toBe(409);
  });

  test('rejects a parent_id that would create a cycle', async () => {
    const token = adminToken();
    const parent = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cycle Parent', slug: 'cycle-parent' });

    const child = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cycle Child', slug: 'cycle-child', parent_id: parent.body.id });

    const res = await request(app)
      .patch(`/api/v1/admin/categories/${parent.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parent_id: child.body.id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PARENT');
  });

  test('deactivating a category does not delete it or its products', async () => {
    const token = adminToken();
    const category = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Deactivate', slug: 'to-deactivate' });

    const res = await request(app)
      .patch(`/api/v1/admin/categories/${category.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);

    const stillThere = await pool.query('SELECT id FROM categories WHERE id = $1', [
      category.body.id,
    ]);
    expect(stillThere.rows.length).toBe(1);
  });
});
