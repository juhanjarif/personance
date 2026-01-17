const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/', authenticateToken, accountController.createAccount);
router.get('/', authenticateToken, accountController.getAccounts);
router.put('/:id', authenticateToken, accountController.updateAccount);

module.exports = router;
