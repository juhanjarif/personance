const transactionModel = require('../models/transactionModel');

const createTransaction = async (req, res) => {
  const { accountId, categoryId, amount, type, typeId, description, toAccountId, toCategoryId } = req.body;
  const userId = req.user.id;

  try {
    // Check if it's a transfer (ID 3 or string 'transfer' for backward compatibility during migration)
    if (typeId === 3 || type === 'transfer') {
        if (!toAccountId) {
            return res.status(400).json({ message: 'Destination account required for transfer' });
        }
        await transactionModel.transferFunds(accountId, toAccountId, amount, categoryId, toCategoryId || categoryId, userId);
        res.status(201).json({ message: 'Transfer completed' });
    } else {
        const transaction = await transactionModel.createTransaction(userId, accountId, categoryId, amount, typeId, description);
        res.status(201).json(transaction);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getTransactions = async (req, res) => {
  const userId = req.user.id;
  try {
    const transactions = await transactionModel.getTransactionsByUserId(userId);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
};
