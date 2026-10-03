const path = require('path');
require('dotenv').config({
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(__dirname, '../.env.test')
      : path.resolve(__dirname, '../.env'),
});
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
