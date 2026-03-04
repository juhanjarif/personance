const pool = require("../db");

const ScheduledPayment = {
  create: async (paymentData) => {
    const {
      user_id,
      category_id,
      account_id,
      to_account_id,
      transaction_type_id,
      amount,
      frequency,
      next_due_date,
    } = paymentData;
    const result = await pool.query(
      `INSERT INTO scheduled_payments (user_id, category_id, account_id, to_account_id, transaction_type_id, amount, frequency, next_due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        user_id,
        category_id,
        account_id,
        to_account_id,
        transaction_type_id,
        amount,
        frequency,
        next_due_date,
      ],
    );
    return result.rows[0];
  },

  getAllByUserId: async (user_id) => {
    const result = await pool.query(
      `SELECT sp.*, c.category_name, tt.type_name as transaction_type, a.account_name, ta.account_name as to_account_name
             FROM scheduled_payments sp
             LEFT JOIN categories c ON sp.category_id = c.category_id
             LEFT JOIN accounts a ON sp.account_id = a.account_id
             LEFT JOIN accounts ta ON sp.to_account_id = ta.account_id
             JOIN transaction_types tt ON sp.transaction_type_id = tt.transaction_type_id
             WHERE sp.user_id = $1
             ORDER BY sp.next_due_date ASC`,
      [user_id],
    );
    return result.rows;
  },

  update: async (id, updateData) => {
    const {
      category_id,
      account_id,
      to_account_id,
      amount,
      frequency,
      next_due_date,
      status,
    } = updateData;
    const result = await pool.query(
      `UPDATE scheduled_payments
             SET category_id = COALESCE($1, category_id),
                 account_id = COALESCE($2, account_id),
                 to_account_id = COALESCE($3, to_account_id),
                 amount = COALESCE($4, amount),
                 frequency = COALESCE($5, frequency),
                 next_due_date = COALESCE($6, next_due_date),
                 status = COALESCE($7, status)
             WHERE scheduled_payment_id = $8 RETURNING *`,
      [
        category_id,
        account_id,
        to_account_id,
        amount,
        frequency,
        next_due_date,
        status,
        id,
      ],
    );
    return result.rows[0];
  },

  delete: async (id) => {
    await pool.query(
      "DELETE FROM scheduled_payments WHERE scheduled_payment_id = $1",
      [id],
    );
    return { message: "Scheduled payment deleted" };
  },
};

module.exports = ScheduledPayment;
