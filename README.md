# Personal Finance Tracker 

A web-based personal finance management system designed to help users track income, expenses, budgets, loans, and financial goals in one centralized platform.

---

## Features

- **Account Management**  
  Support for multiple account types with real-time balance updates.

- **Transaction Management**  
  Track income, expenses, and transfers between accounts.

- **Budget & Goal Tracking**  
  Set and monitor budgets, rent, loan payments, and savings goals.

- **Smart Notifications**  
  Get alerts when budgets are exceeded or payments are missed.

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
- `budgets` – Monthly/yearly budget limits per category
- `loans` – Loan details and repayment tracking
- `financial_goals` – Savings goals with deadlines
- `notifications` – System alerts for users
- `audit_log` – Log of important system events

---

## Tech Stack

| Layer        | Technology       |
|--------------|------------------|
| **Frontend** | React, HTML, CSS |
| **Backend**  | Node.js, Express |
| **Database** | PostgreSQL       |
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
