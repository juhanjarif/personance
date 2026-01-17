const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authenticateToken = require('../middleware/authMiddleware');

// Budgets
router.post('/budgets', authenticateToken, financialController.createBudget);
router.get('/budgets', authenticateToken, financialController.getBudgets);
router.delete('/budgets/:id', authenticateToken, financialController.deleteBudget);

// Goals
router.post('/goals', authenticateToken, financialController.createGoal);
router.get('/goals', authenticateToken, financialController.getGoals);
router.delete('/goals/:id', authenticateToken, financialController.deleteGoal);

// Loans
router.post('/loans', authenticateToken, financialController.createLoan);
router.get('/loans', authenticateToken, financialController.getLoans);

// Categories
router.get('/categories', authenticateToken, financialController.getCategories);

module.exports = router;
