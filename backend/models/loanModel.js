const db = require('../db');

const createLoan = async (userId, loanData) => {
    const {
        purpose, principalAmount, interestRate,
        interestType, paymentFrequency, startDate,
        gracePeriodMonths, notes
    } = loanData;

    // Query: Create Loan
    const query = `
        INSERT INTO loans (
            user_id, purpose, principal_amount, 
            interest_rate, interest_type, payment_frequency, 
            start_date, grace_period_months, notes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *
    `;
    const values = [
        userId, purpose, principalAmount,
        interestRate, interestType, paymentFrequency,
        startDate, gracePeriodMonths || 0, notes
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getLoansByUserId = async (userId) => {
    // Query: Get Loans by User ID
    const query = 'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);
    return result.rows;
};

const deleteLoan = async (loanId) => {
    // Query: Delete Loan
    const query = 'DELETE FROM loans WHERE loan_id = $1 RETURNING *';
    const result = await db.query(query, [loanId]);
    return result.rows[0];
};

const updateLoanStatus = async (loanId, status) => {
    // Query: Update Loan Status
    const query = 'UPDATE loans SET status = $1 WHERE loan_id = $2 RETURNING *';
    const result = await db.query(query, [status, loanId]);
    return result.rows[0];
}

const repayLoan = async (userId, loanId, accountId, amount) => {
    // Query: Repay Loan (Call Procedure)
    const query = 'CALL process_loan_repayment($1, $2, $3, $4)';
    await db.query(query, [loanId, accountId, amount, userId]);
    return { success: true };
};

module.exports = {
    createLoan,
    getLoansByUserId,
    deleteLoan,
    updateLoanStatus,
    repayLoan
};
