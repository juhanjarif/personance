const financialModel = require('../models/financialModel');

const createBudget = async (req, res) => {
  const { categoryId, month, year, amountLimit } = req.body;
  const userId = req.user.id;
  try {
    const budget = await financialModel.createBudget(userId, categoryId, month, year, amountLimit);
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

const createLoan = async (req, res) => {
    const { loanName, principalAmount, interestRate, startDate } = req.body;
    const userId = req.user.id;
    try {
        const loan = await financialModel.createLoan(userId, loanName, principalAmount, interestRate, startDate);
        res.status(201).json(loan);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getLoans = async (req, res) => {
    const userId = req.user.id;
    try {
        const loans = await financialModel.getLoans(userId);
        res.json(loans);
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

module.exports = {
  createBudget,
  getBudgets,
  createGoal,
  getGoals,
  createLoan,
  getLoans,
  getCategories
};
