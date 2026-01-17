const accountModel = require('../models/accountModel');

const createAccount = async (req, res) => {
  const { accountTypeId, accountName, initialBalance } = req.body;
  const userId = req.user.id;

  try {
    const account = await accountModel.createAccount(userId, accountTypeId, accountName, initialBalance || 0);
    res.status(201).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAccounts = async (req, res) => {
  const userId = req.user.id;
  try {
    const accounts = await accountModel.getAccountsByUserId(userId);
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAccount = async (req, res) => {
    const { id } = req.params;
    const { accountName } = req.body;
    const userId = req.user.id;
    
    if (!accountName) {
        return res.status(400).json({ message: 'Account name is required' });
    }

    try {
        const updatedAccount = await accountModel.updateAccountName(id, accountName, userId);
        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found or unauthorized' });
        }
        res.json(updatedAccount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
  createAccount,
  getAccounts,
  updateAccount,
};
