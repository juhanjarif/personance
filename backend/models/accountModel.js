const db = require('../db');

const createAccount = async (userId, accountTypeId, accountName, initialBalance) => {
  // Query: Create Account
  const query = 'INSERT INTO accounts (user_id, account_type_id, account_name, current_balance) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [userId, accountTypeId, accountName, initialBalance];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getAccountsByUserId = async (userId) => {
  // Query: Get Accounts by User ID
  const query = `
    SELECT a.*, at.type_name 
    FROM accounts a
    JOIN account_types at ON a.account_type_id = at.account_type_id
    WHERE a.user_id = $1
    ORDER BY a.created_at ASC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const updateAccountName = async (accountId, newName, userId) => {
  // Query: Update Account Name
  const query = 'UPDATE accounts SET account_name = $1 WHERE account_id = $2 AND user_id = $3 RETURNING *';
  const values = [newName, accountId, userId];
  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteAccount = async (accountId, userId) => {
  // Query: Delete Account
  const query = 'DELETE FROM accounts WHERE account_id = $1 AND user_id = $2 RETURNING *';
  const result = await db.query(query, [accountId, userId]);
  return result.rows[0];
};

module.exports = {
  createAccount,
  getAccountsByUserId,
  updateAccountName,
  deleteAccount,
};
