CREATE OR REPLACE FUNCTION update_balance() 
RETURNS TRIGGER AS $$
DECLARE
    acct_type VARCHAR;
BEGIN
    IF NEW.transaction_type = 'income' THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE account_id = NEW.account_id;
    ELSIF NEW.transaction_type = 'expense' THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE account_id = NEW.account_id;
    ELSIF NEW.transaction_type = 'transfer' THEN
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER balance_update
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_balance();

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
BEGIN
    SELECT account_name INTO sender_name FROM accounts WHERE account_id = sender_id;
    SELECT account_name INTO receiver_name FROM accounts WHERE account_id = receiver_id;

    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description)
    VALUES (user_id, sender_id, sender_cat_id, transfer_amount, 'expense', 'Transfer Out to ' || receiver_name);
    
    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description)
    VALUES (user_id, receiver_id, receiver_cat_id, transfer_amount, 'income', 'Transfer In from ' || sender_name);
    
    COMMIT;
END;
$$;

CREATE OR REPLACE FUNCTION validate_transaction()
RETURNS TRIGGER AS $$
DECLARE
    cur_bal DECIMAL;
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
    
    IF NEW.transaction_type = 'expense' THEN
        SELECT current_balance INTO cur_bal FROM accounts WHERE account_id = NEW.account_id;
        IF cur_bal < NEW.amount THEN
             RAISE EXCEPTION 'Insufficient funds';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_validation
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION validate_transaction();

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action_type, details)
    VALUES (NULL, 'INSERT', 'New transaction created ID: ' || NEW.transaction_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_audit();

CREATE OR REPLACE FUNCTION validate_loan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.principal_amount <= 0 THEN
        RAISE EXCEPTION 'Principal amount must be positive';
    END IF;

    IF NEW.due_date < NEW.start_date THEN
        RAISE EXCEPTION 'Due date cannot be earlier than start date';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_validation
BEFORE INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION validate_loan();

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

CREATE TRIGGER loan_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON loans
FOR EACH ROW
EXECUTE FUNCTION log_loan_audit();
