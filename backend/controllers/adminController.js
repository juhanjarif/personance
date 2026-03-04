const db = require("../db");

const getDailyTallies = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM daily_transaction_summary ORDER BY transaction_date DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching daily tallies" });
  }
};

const getMonthlyTallies = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM monthly_transaction_summary ORDER BY transaction_month DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching monthly tallies" });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM admin_transaction_all ORDER BY transaction_date DESC, created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching all transactions" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT a.*, u.name as user_name, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.user_id ORDER BY a.created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching audit logs" });
  }
};

module.exports = {
  getDailyTallies,
  getMonthlyTallies,
  getAllTransactions,
  getAuditLogs,
};
