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
    v_budget_limit DECIMAL;
    v_spent_so_far DECIMAL;
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
    
    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    IF NEW.transaction_type_id = expense_id THEN
        -- Check Account Balance
        SELECT current_balance INTO cur_bal FROM accounts WHERE account_id = NEW.account_id;
        IF cur_bal < NEW.amount THEN
             RAISE EXCEPTION 'Insufficient funds';
        END IF;

        -- Check Budget
        -- Get total monthly budget (category_id is NULL for total budget)
        SELECT amount_limit INTO v_budget_limit 
        FROM budgets 
        WHERE user_id = NEW.user_id 
          AND category_id IS NULL 
          AND NEW.transaction_date BETWEEN start_date AND end_date;

        IF v_budget_limit IS NOT NULL THEN
            -- Calculate spent in current budget period
            SELECT COALESCE(SUM(amount), 0) INTO v_spent_so_far
            FROM transactions
            WHERE user_id = NEW.user_id
              AND transaction_type_id = expense_id
              AND transaction_date BETWEEN (SELECT start_date FROM budgets WHERE user_id = NEW.user_id AND category_id IS NULL AND NEW.transaction_date BETWEEN start_date AND end_date)
                                      AND (SELECT end_date FROM budgets WHERE user_id = NEW.user_id AND category_id IS NULL AND NEW.transaction_date BETWEEN start_date AND end_date);

            IF (v_spent_so_far + NEW.amount) > v_budget_limit THEN
                RAISE EXCEPTION 'Transaction exceeds budget limit (Tk. %)', v_budget_limit;
            END IF;
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

    -- Automatically close loan if paid off
    UPDATE loans
    SET status = 'closed'
    WHERE loan_id = p_loan_id AND paid_amount >= total_repayment_amount;

    COMMIT;
END;
$$;

-- Procedure: add_goal_money
CREATE OR REPLACE PROCEDURE add_goal_money(
    p_goal_id INT,
    p_account_id INT,
    p_amount DECIMAL,
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_goal_name VARCHAR;
    v_account_name VARCHAR;
    expense_id INT;
BEGIN
    SELECT goal_name INTO v_goal_name FROM financial_goals WHERE financial_goal_id = p_goal_id;
    
    SELECT account_name INTO v_account_name FROM accounts WHERE account_id = p_account_id;

    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';
    
    -- Get expense type ID
    SELECT transaction_type_id INTO expense_id FROM transaction_types WHERE type_name = 'expense';

    -- Create Transaction
    INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type_id, description)
    VALUES (p_user_id, p_account_id, NULL, p_amount, expense_id, 'Goal Contribution: ' || v_goal_name);

    -- Update Goal Current Amount
    UPDATE financial_goals 
    SET current_amount = COALESCE(current_amount, 0) + p_amount 
    WHERE financial_goal_id = p_goal_id;

    -- Create Notification
    INSERT INTO notifications (user_id, title, message, is_read)
    VALUES (p_user_id, 'Goal Contribution', 'You added Tk. ' || p_amount || ' to goal: ' || v_goal_name, FALSE);

    COMMIT;
END;
$$;


-- Add to 02_procedures_triggers.sql
CREATE OR REPLACE PROCEDURE accrue_loan_interest()
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan_record RECORD;
    v_interest_amount DECIMAL;
    v_interval INTERVAL;
BEGIN
    -- Loop through all active loans
    FOR v_loan_record IN 
        SELECT loan_id, principal_amount, interest_rate, interest_type, total_repayment_amount, paid_amount, due_date, return_frequency
        FROM loans WHERE status = 'active' AND due_date <= CURRENT_DATE
    LOOP
        -- Determine the interval for advancing due date
        CASE UPPER(v_loan_record.return_frequency)
            WHEN 'QUARTERLY' THEN v_interval := '3 months'::INTERVAL;
            WHEN 'HALF-YEARLY' THEN v_interval := '6 months'::INTERVAL;
            WHEN 'YEARLY' THEN v_interval := '1 year'::INTERVAL;
            ELSE v_interval := '1 month'::INTERVAL; -- Default to Monthly
        END CASE;

        -- Catch up if multiple periods have passed
        WHILE v_loan_record.due_date <= CURRENT_DATE LOOP
            -- Normalize interest type to lowercase
            IF LOWER(v_loan_record.interest_type) = 'simple' THEN
                -- Interest on Principal only (standard APR / 12 for monthly accrual)
                v_interest_amount := (v_loan_record.principal_amount * v_loan_record.interest_rate / 100) / 12;
            ELSIF LOWER(v_loan_record.interest_type) = 'compound' THEN
                -- Interest on the CURRENT total (Principal + existing Interest)
                v_interest_amount := (COALESCE(v_loan_record.total_repayment_amount, v_loan_record.principal_amount) * v_loan_record.interest_rate / 100) / 12;
            ELSIF LOWER(v_loan_record.interest_type) = 'emi' THEN
                -- Interest on Reducing Balance
                v_interest_amount := ((v_loan_record.principal_amount - COALESCE(v_loan_record.paid_amount, 0)) * v_loan_record.interest_rate / 100) / 12;
            ELSE
                v_interest_amount := 0;
            END IF;

            -- Update the loan record state in the DB
            UPDATE loans 
            SET 
                total_repayment_amount = COALESCE(total_repayment_amount, principal_amount) + v_interest_amount,
                due_date = due_date + v_interval
            WHERE loan_id = v_loan_record.loan_id;

            -- Log the accrual
            INSERT INTO audit_logs (user_id, action_type, details)
            VALUES (NULL, 'UPDATE', 'Interest auto-accrued for Loan ID: ' || v_loan_record.loan_id || '. Amount: ' || v_interest_amount || '. New Due Date: ' || (v_loan_record.due_date + v_interval));

            -- Update local loop variables to continue catch-up if needed
            v_loan_record.total_repayment_amount := COALESCE(v_loan_record.total_repayment_amount, v_loan_record.principal_amount) + v_interest_amount;
            v_loan_record.due_date := v_loan_record.due_date + v_interval;
        END LOOP;
    END LOOP;
END;
$$;

-- Add to 02_procedures_triggers.sql
CREATE OR REPLACE FUNCTION get_category_tree_total(p_user_id INT, p_category_id INT)
RETURNS DECIMAL AS $$
DECLARE
    v_total DECIMAL := 0;
    v_current_amount DECIMAL;
    -- Cursor to find all categories in this branch
    cat_cursor CURSOR FOR 
        WITH RECURSIVE category_tree AS (
            SELECT category_id FROM categories WHERE category_id = p_category_id
            UNION ALL
            SELECT c.category_id FROM categories c
            JOIN category_tree ct ON c.parent_category_id = ct.category_id
        )
        SELECT category_id FROM category_tree;
    v_cat_id INT;
BEGIN
    OPEN cat_cursor;
    LOOP
        FETCH cat_cursor INTO v_cat_id;
        EXIT WHEN NOT FOUND;
        
        -- Get sum for this specific category
        SELECT COALESCE(SUM(amount), 0) INTO v_current_amount
        FROM transactions 
        WHERE user_id = p_user_id AND category_id = v_cat_id;
        
        v_total := v_total + v_current_amount;
    END LOOP;
    CLOSE cat_cursor;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;
