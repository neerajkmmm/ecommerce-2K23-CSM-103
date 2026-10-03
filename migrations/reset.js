// Drops and recreates the public schema — for the disposable TEST database only.
// Never point this at a dev/prod DATABASE_URL.
const pool = require('../src/db');

async function reset() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('refusing to run migrations/reset.js outside NODE_ENV=test');
  }
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    console.log('Test schema reset.');
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
