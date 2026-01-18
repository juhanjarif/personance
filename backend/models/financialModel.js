const db = require('../db');

const createBudget = async (userId, categoryId, startDate, endDate, amountLimit) => {
  // Reset logic: Delete existing budget for the same scope (Total Budget if categoryId is null)
  if (!categoryId) {
    await db.query('DELETE FROM budgets WHERE user_id = $1 AND category_id IS NULL', [userId]);
  } else {
    await db.query('DELETE FROM budgets WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
  }

  const query = 'INSERT INTO budgets (user_id, category_id, start_date, end_date, amount_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [userId, categoryId || null, startDate, endDate, amountLimit];
  const result = await db.query(query, values);
  return result.rows[0];
};

const getBudgets = async (userId) => {
  const query = `
    SELECT b.*, c.category_name 
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.category_id
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

const deleteGoal = async (goalId, userId) => {
    const query = 'DELETE FROM financial_goals WHERE financial_goal_id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(query, [goalId, userId]);
    return result.rows[0];
};

const deleteBudget = async (budgetId, userId) => {
    const query = 'DELETE FROM budgets WHERE budget_id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(query, [budgetId, userId]);
    return result.rows[0];
};

const getCategories = async (userId) => {
  const query = 'SELECT * FROM categories WHERE user_id = $1 OR user_id IS NULL';
  const result = await db.query(query, [userId]);
  return result.rows;
};

module.exports = {
  createBudget,
  getBudgets,
  deleteBudget,
  createGoal,
  getGoals,
  deleteGoal,
  getCategories
};
