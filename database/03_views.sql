CREATE OR REPLACE VIEW admin_transaction_all AS
SELECT 
    t.transaction_id,
    u.name AS user_name,
    u.email AS user_email,
    a.account_name,
    c.category_name,
    t.amount,
    t.transaction_date,
    tt.type_name AS transaction_type,
    t.description,
    t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.user_id
JOIN accounts a ON t.account_id = a.account_id
LEFT JOIN categories c ON t.category_id = c.category_id
JOIN transaction_types tt ON t.transaction_type_id = tt.transaction_type_id;

CREATE OR REPLACE VIEW daily_transaction_summary AS
SELECT 
    transaction_date,
    COUNT(transaction_id) AS total_transactions,
    SUM(CASE WHEN tt.type_name = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN tt.type_name = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM transactions t
JOIN transaction_types tt ON t.transaction_type_id = tt.transaction_type_id
GROUP BY transaction_date;

CREATE OR REPLACE VIEW monthly_transaction_summary AS
SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') AS transaction_month,
    COUNT(transaction_id) AS total_transactions,
    SUM(CASE WHEN tt.type_name = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN tt.type_name = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM transactions t
JOIN transaction_types tt ON t.transaction_type_id = tt.transaction_type_id
GROUP BY transaction_month;

