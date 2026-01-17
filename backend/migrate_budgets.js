const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    
    // Check if budgets table has start_date
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'budgets' AND column_name = 'start_date'
    `);

    if (res.rows.length === 0) {
      console.log('Updating budgets table schema...');
      await client.query('ALTER TABLE budgets DROP COLUMN IF EXISTS month');
      await client.query('ALTER TABLE budgets DROP COLUMN IF EXISTS year');
      await client.query('ALTER TABLE budgets ADD COLUMN start_date DATE DEFAULT CURRENT_DATE');
      await client.query('ALTER TABLE budgets ADD COLUMN end_date DATE DEFAULT (CURRENT_DATE + interval \'1 month\')');
      await client.query('ALTER TABLE budgets ALTER COLUMN start_date SET NOT NULL');
      await client.query('ALTER TABLE budgets ALTER COLUMN end_date SET NOT NULL');
      console.log('Budgets table updated.');
    } else {
      console.log('Budgets table already has new schema.');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
