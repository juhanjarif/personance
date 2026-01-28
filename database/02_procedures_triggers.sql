DROP TRIGGER IF EXISTS balance_update ON transactions;
DROP FUNCTION IF EXISTS update_balance();
DROP PROCEDURE IF EXISTS fund_transfer(INT, INT, DECIMAL, INT, INT, INT);
DROP TRIGGER IF EXISTS transaction_validation ON transactions;
DROP FUNCTION IF EXISTS validate_transaction();
DROP TRIGGER IF EXISTS audit_log_trigger ON transactions;
DROP FUNCTION IF EXISTS log_audit();
DROP TRIGGER IF EXISTS loan_validation ON loans;
DROP FUNCTION IF EXISTS validate_loan();
DROP TRIGGER IF EXISTS loan_audit_trigger ON loans;
DROP FUNCTION IF EXISTS log_loan_audit();
DROP PROCEDURE IF EXISTS process_loan_repayment(INT, INT, DECIMAL, INT);

-- Function: update_balance
CREATE OR REPLACE FUNCTION update_balance() 
RETURNS TRIGGER AS $$
DECLARE
    income_id INT;
    expense_id INT;
BEGIN
    SELECT transaction_type_id INTO income_id FROM transaction_types WHERE type_name = 'income';
    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    IF NEW.transaction_type_id = income_id THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE account_id = NEW.account_id;
    ELSIF NEW.transaction_type_id = expense_id THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE account_id = NEW.account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: balance_update
CREATE TRIGGER balance_update
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_balance();

-- Procedure: fund_transfer
CREATE OR REPLACE PROCEDURE fund_transfer(
    sender_id INT,
    receiver_id INT,
    transfer_amount DECIMAL,
    sender_cat_id INT,
    receiver_cat_id INT,
    user_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    sender_name VARCHAR;
    receiver_name VARCHAR;
    income_id INT;
    expense_id INT;
BEGIN
    SELECT account_name INTO sender_name FROM accounts WHERE account_id = sender_id;
    SELECT account_name INTO receiver_name FROM accounts WHERE account_id = receiver_id;
    SELECT transaction_type_id INTO income_id FROM transaction_types WHERE type_name = 'income';
    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type_id, description)
    VALUES (user_id, sender_id, sender_cat_id, transfer_amount, expense_id, 'Transfer Out to ' || receiver_name);
    
    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type_id, description)
    VALUES (user_id, receiver_id, receiver_cat_id, transfer_amount, income_id, 'Transfer In from ' || sender_name);
    
    COMMIT;
END;
$$;

-- Function: validate_transaction
CREATE OR REPLACE FUNCTION validate_transaction()
RETURNS TRIGGER AS $$
DECLARE
    cur_bal DECIMAL;
    expense_id INT;
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
    
    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    IF NEW.transaction_type_id = expense_id THEN
        SELECT current_balance INTO cur_bal FROM accounts WHERE account_id = NEW.account_id;
        IF cur_bal < NEW.amount THEN
             RAISE EXCEPTION 'Insufficient funds';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: transaction_validation
CREATE TRIGGER transaction_validation
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION validate_transaction();

-- Function: log_audit
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action_type, details)
    VALUES (NULL, 'INSERT', 'New transaction created ID: ' || NEW.transaction_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: audit_log_trigger
CREATE TRIGGER audit_log_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_audit();

-- Function: validate_loan
CREATE OR REPLACE FUNCTION validate_loan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.principal_amount <= 0 THEN
        RAISE EXCEPTION 'Principal amount must be positive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: loan_validation
CREATE TRIGGER loan_validation
BEFORE INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION validate_loan();

-- Function: log_loan_audit
CREATE OR REPLACE FUNCTION log_loan_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, action_type, details)
        VALUES (NEW.user_id, 'INSERT', 'New loan created. Amount: ' || NEW.principal_amount || ', Purpose: ' || NEW.purpose);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO audit_logs (user_id, action_type, details)
            VALUES (NEW.user_id, 'UPDATE', 'Loan status changed from ' || OLD.status || ' to ' || NEW.status || ' (ID: ' || NEW.loan_id || ')');
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (user_id, action_type, details)
        VALUES (OLD.user_id, 'DELETE', 'Loan deleted. Amount: ' || OLD.principal_amount || ' (ID: ' || OLD.loan_id || ')');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: loan_audit_trigger
CREATE TRIGGER loan_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON loans
FOR EACH ROW
EXECUTE FUNCTION log_loan_audit();

-- Procedure: process_loan_repayment
CREATE OR REPLACE PROCEDURE process_loan_repayment(
    p_loan_id INT,
    p_account_id INT,
    p_amount DECIMAL,
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan_purpose VARCHAR;
    v_account_name VARCHAR;
    v_category_id INT;
    expense_id INT;
BEGIN
    SELECT purpose INTO v_loan_purpose FROM loans WHERE loan_id = p_loan_id;
    
    SELECT account_name INTO v_account_name FROM accounts WHERE account_id = p_account_id;

    SELECT category_id INTO v_category_id FROM categories WHERE user_id = p_user_id LIMIT 1;

    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type_id, description)
    VALUES (p_user_id, p_account_id, v_category_id, p_amount, expense_id, 'Loan Repayment: ' || v_loan_purpose);

    UPDATE loans 
    SET paid_amount = COALESCE(paid_amount, 0) + p_amount 
    WHERE loan_id = p_loan_id;

    COMMIT;
END;
$$;
