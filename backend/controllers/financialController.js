const financialModel = require('../models/financialModel');

const createBudget = async (req, res) => {
  const { categoryId, startDate, endDate, amountLimit } = req.body;
  const userId = req.user.id;
  try {
    const budget = await financialModel.createBudget(userId, categoryId, startDate, endDate, amountLimit);
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBudgets = async (req, res) => {
  const userId = req.user.id;
  try {
    const budgets = await financialModel.getBudgets(userId);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBudget = async (req, res) => {
  const userId = req.user.id;
  try {
    const budget = await financialModel.deleteBudget(req.params.id, userId);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createGoal = async (req, res) => {
  const { goalName, targetAmount, deadline } = req.body;
  const userId = req.user.id;
  try {
    const goal = await financialModel.createGoal(userId, goalName, targetAmount, deadline);
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const goals = await financialModel.getGoals(userId);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    const goal = await financialModel.deleteGoal(req.params.id, userId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  const userId = req.user.id;
  try {
    const categories = await financialModel.getCategories(userId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addGoalMoney = async (req, res) => {
  const { goalId, accountId, amount } = req.body;
  const userId = req.user.id;
  if (!goalId || !accountId || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await financialModel.addGoalMoney(userId, goalId, accountId, amount);
    res.json({ message: 'Money added to goal successfully' });
  } catch (error) {
    console.error('Error adding money to goal:', error);
    res.status(500).json({ message: 'Server error adding money to goal' });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  deleteBudget,
  createGoal,
  getGoals,
  deleteGoal,
  getCategories,
  addGoalMoney
};
