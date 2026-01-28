# Personal Finance Tracker 

A web-based personal finance management system designed to help users track income, expenses, budgets, loans, and financial goals in one centralized platform.

---

## Features

- **Account Management**  
  Support for multiple account types with real-time balance updates.

- **Transaction Management**  
  Track income, expenses, and transfers between accounts.

- **Budget & Goal Tracking**  
  Set and monitor budgets and savings goals.

- **Financial Analytics**  
  Monthly summaries, spending categorization, and income vs. expense insights.

- **Loan Calculator**  
  Automatically compute interest and repayment schedules.

---

## Database Schema

The system uses a relational database model with the following main tables along with other tables as well:

- `users` – User profiles and authentication
- `accounts` – Bank/wallet accounts linked to users
- `transactions` – Records of all financial transactions
- `categories` – Income/expense categories
- `budgets` – Budget limits per category
- `loans` – Loan details and repayment tracking
- `financial_goals` – Savings goals with deadlines
- `audit_log` – Log of important system events

---

## Tech Stack

| Layer        | Technology       |
|--------------|------------------|
| **Frontend** | React, HTML, CSS |
| **Backend**  | Node.js, Express |
| **Database** | PostgreSQL, Docker |
| **Version Control** | Git, GitHub |

---

## Role of RDBMS

- **Automation** – Business logic implemented via stored procedures and triggers
- **Security** – Role-based access control (RBAC)
- **Integrity** – Constraints and transactions ensure data consistency
- **Performance** – Optimized queries and indexing

---

## Key Database Features

### Stored Procedures
- `TransactionProcedure` – Updates account balances automatically
- `FundTransferProcedure` – Handles transfers with rollback on error

### Triggers
- `TransactionValidation` – Validates transaction data before commit
- `BalanceUpdate` – Auto-updates account balance after transactions
- `AuditLog` – Logs changes to critical tables

### Sample Queries
- Categorized monthly expenses
- Income vs. expense trends over time
- Loan repayment calculations with interest

---

## Team Roles

| Member                     |
|----------------------------|
| Juhan Ahmed Jarif          |
| Tanvir Mahmud Hossain      |
| Aakash Abdullah Siddhartha |

---

## How to Run
1. Run `docker compose up --build` to start the database.
2. Run `npm install` in the backend directory to install dependencies.
3. Run `npm install` in the frontend directory to install dependencies.
4. Run `npm start` in the backend directory to start the server.
5. Run `npm start` in the frontend directory to start the frontend.