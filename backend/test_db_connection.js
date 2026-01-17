const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing DB Connection...');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
// Don't log password

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
    
    // Check if users table exists
    const tableRes = await pool.query("SELECT to_regclass('public.users')");
    console.log('Users table check:', tableRes.rows[0]);
    
  } catch (err) {
    console.error('Connection error', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  } finally {
    pool.end();
  }
}

test();
