const loanModel = require('../models/loanModel');

const createLoan = async (req, res) => {
    try {
        const {
            lenderName, purpose, principalAmount, interestRate,
            interestType, paymentFrequency, startDate,
            dueDate, gracePeriodMonths, notes
        } = req.body;

        if (!lenderName || !purpose || !principalAmount || !interestRate || !startDate || !dueDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newLoan = await loanModel.createLoan(req.user.id, {
            lenderName, purpose, principalAmount, interestRate,
            interestType, paymentFrequency, startDate,
            dueDate, gracePeriodMonths, notes
        });

        res.status(201).json(newLoan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating loan' });
    }
};

const getLoans = async (req, res) => {
    try {
        const loans = await loanModel.getLoansByUserId(req.user.id);
        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching loans' });
    }
};

const deleteLoan = async (req, res) => {
    try {
        const loan = await loanModel.deleteLoan(req.params.id);
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json({ message: 'Loan deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting loan' });
    }
};

const updateLoanStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const loan = await loanModel.updateLoanStatus(req.params.id, status);
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json(loan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating loan status' });
    }
}

module.exports = {
    createLoan,
    getLoans,
    deleteLoan,
    updateLoanStatus
};
