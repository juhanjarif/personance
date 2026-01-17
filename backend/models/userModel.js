const db = require('../db');

const createUser = async (name, email, passwordHash) => {
  const query = 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, name, email, role_id';
  const values = [name, email, passwordHash];
  const result = await db.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await db.query(query, [email]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
