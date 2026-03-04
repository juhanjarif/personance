const db = require("../db");

const createTransaction = async (
  userId,
  accountId,
  categoryId,
  amount,
  typeId,
  description,
) => {
  // Query: Create Transaction
  const query =
    "INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
  const values = [userId, accountId, categoryId, amount, typeId, description];
  const result = await db.query(query, values);
  return result.rows[0];
};

const transferFunds = async (
  senderId,
  receiverId,
  amount,
  senderCatId,
  receiverCatId,
  userId,
) => {
  // Query: Transfer Funds (Call Procedure)
  const query = "CALL fund_transfer($1, $2, $3, $4, $5, $6)";
  const values = [
    senderId,
    receiverId,
    amount,
    senderCatId,
    receiverCatId,
    userId,
  ];
  await db.query(query, values);
  return { message: "Transfer successful" };
};

const getTransactionsByUserId = async (userId) => {
  // Query: Get Transactions by User ID
  const query = `
    SELECT t.*, c.category_name, a.account_name, tt.type_name as transaction_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.category_id
    JOIN accounts a ON t.account_id = a.account_id
    JOIN transaction_types tt ON t.transaction_type_id = tt.transaction_type_id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const getMonthlySummary = async (userId, month) => {
  // Query: Get Monthly Summary from View
  const query = `
    SELECT * 
    FROM user_monthly_transaction_summary 
    WHERE user_id = $1 AND transaction_month = $2
  `;
  const result = await db.query(query, [userId, month]);
  return (
    result.rows[0] || {
      total_income: 0,
      total_expense: 0,
      total_transactions: 0,
    }
  );
};

module.exports = {
  createTransaction,
  transferFunds,
  getTransactionsByUserId,
  getMonthlySummary,
};
