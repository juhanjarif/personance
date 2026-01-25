const db = require('../db');

const createLoansTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS loans (
            loan_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            lender_name VARCHAR(255) NOT NULL,
            purpose VARCHAR(255) NOT NULL,
            principal_amount DECIMAL(12, 2) NOT NULL,
            interest_rate DECIMAL(5, 2) NOT NULL,
            interest_type VARCHAR(50) NOT NULL, -- 'simple', 'compound', 'emi'
            payment_frequency VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly'
            start_date DATE NOT NULL,
            due_date DATE NOT NULL,
            grace_period_months INTEGER DEFAULT 0,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await db.query(query);
};

createLoansTable().catch(err => console.error('Error creating loans table:', err));

const createLoan = async (userId, loanData) => {
    const {
        lenderName, purpose, principalAmount, interestRate,
        interestType, paymentFrequency, startDate,
        dueDate, gracePeriodMonths, notes
    } = loanData;

    const query = `
        INSERT INTO loans (
            user_id, lender_name, purpose, principal_amount, 
            interest_rate, interest_type, payment_frequency, 
            start_date, due_date, grace_period_months, notes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *
    `;
    const values = [
        userId, lenderName, purpose, principalAmount,
        interestRate, interestType, paymentFrequency,
        startDate, dueDate, gracePeriodMonths || 0, notes
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getLoansByUserId = async (userId) => {
    const query = 'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);
    return result.rows;
};

const deleteLoan = async (loanId) => {
    const query = 'DELETE FROM loans WHERE loan_id = $1 RETURNING *';
    const result = await db.query(query, [loanId]);
    return result.rows[0];
};

const updateLoanStatus = async (loanId, status) => {
    const query = 'UPDATE loans SET status = $1 WHERE loan_id = $2 RETURNING *';
    const result = await db.query(query, [status, loanId]);
    return result.rows[0];
}

module.exports = {
    createLoan,
    getLoansByUserId,
    deleteLoan,
    updateLoanStatus
};
