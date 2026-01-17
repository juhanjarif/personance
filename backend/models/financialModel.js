const db = require('../db');

const createBudget = async (userId, categoryId, month, year, amountLimit) => {
  const query = 'INSERT INTO budgets (user_id, category_id, month, year, amount_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [userId, categoryId, month, year, amountLimit];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getBudgets = async (userId) => {
  const query = `
    SELECT b.*, c.category_name 
    FROM budgets b
    JOIN categories c ON b.category_id = c.category_id
    WHERE b.user_id = $1
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const createGoal = async (userId, goalName, targetAmount, deadline) => {
    const query = 'INSERT INTO financial_goals (user_id, goal_name, target_amount, deadline) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [userId, goalName, targetAmount, deadline];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getGoals = async (userId) => {
    const query = 'SELECT * FROM financial_goals WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows;
};

const createLoan = async (userId, loanName, principalAmount, interestRate, startDate) => {
    const query = 'INSERT INTO loans (user_id, loan_name, principal_amount, interest_rate, start_date) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [userId, loanName, principalAmount, interestRate, startDate];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getLoans = async (userId) => {
    const query = 'SELECT * FROM loans WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows;
};

const getCategories = async (userId) => {
  const query = 'SELECT * FROM categories WHERE user_id = $1 OR user_id IS NULL';
  const result = await db.query(query, [userId]);
  return result.rows;
};

module.exports = {
  createBudget,
  getBudgets,
  createGoal,
  getGoals,
  createLoan,
  getLoans,
  getCategories
};
