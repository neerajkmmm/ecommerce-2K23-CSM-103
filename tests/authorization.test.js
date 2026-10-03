require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { customerToken } = require('./helpers/auth');

const protectedRoutes = [
  { method: 'post', path: '/api/v1/admin/categories' },
  { method: 'patch', path: '/api/v1/admin/categories/1' },
  { method: 'post', path: '/api/v1/admin/products' },
  { method: 'patch', path: '/api/v1/admin/products/1' },
  { method: 'post', path: '/api/v1/admin/products/1/skus' },
  { method: 'patch', path: '/api/v1/admin/skus/1' },
];

describe('Admin route authorization (CAT06)', () => {
  afterAll(async () => {
    await pool.end();
  });

  test.each(protectedRoutes)('rejects $method $path with no token', async ({ method, path }) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });

  test.each(protectedRoutes)('rejects $method $path for a non-admin token', async ({ method, path }) => {
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({});
    expect(res.status).toBe(403);
  });
});
