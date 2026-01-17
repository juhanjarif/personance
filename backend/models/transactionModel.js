const db = require('../db');

const createTransaction = async (userId, accountId, categoryId, amount, type, description) => {
  const query = 'INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  const values = [userId, accountId, categoryId, amount, type, description];
  const result = await db.query(query, values);
  return result.rows[0];
};

const transferFunds = async (senderId, receiverId, amount, senderCatId, receiverCatId, userId) => {
    const query = 'CALL fund_transfer($1, $2, $3, $4, $5, $6)';
    const values = [senderId, receiverId, amount, senderCatId, receiverCatId, userId];
    await db.query(query, values);
    return { message: 'Transfer successful' };
};

const getTransactionsByUserId = async (userId) => {
  const query = `
    SELECT t.*, c.category_name, a.account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.category_id
    JOIN accounts a ON t.account_id = a.account_id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

module.exports = {
  createTransaction,
  transferFunds,
  getTransactionsByUserId,
};
