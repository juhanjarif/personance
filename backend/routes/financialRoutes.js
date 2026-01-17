const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authenticateToken = require('../middleware/authMiddleware');

// Budgets
router.post('/budgets', authenticateToken, financialController.createBudget);
router.get('/budgets', authenticateToken, financialController.getBudgets);

// Goals
router.post('/goals', authenticateToken, financialController.createGoal);
router.get('/goals', authenticateToken, financialController.getGoals);

// Loans
router.post('/loans', authenticateToken, financialController.createLoan);
router.get('/loans', authenticateToken, financialController.getLoans);

// Categories
router.get('/categories', authenticateToken, financialController.getCategories);

module.exports = router;
