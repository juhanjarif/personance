# Personance - A Personal Finance Tracker  

Personance is a web-based personal finance management system designed to help it's users to track their income, expenses, budgets, loans, and financial goals in one centralized platform.

---

## **How to Run**

***Important:** Make sure Docker Desktop is running in the background before starting the project.*

### 1. Start Database (Docker)
```bash
docker compose up --build
```
*Starts PostgreSQL database inside Docker container.*

---

### 2. Start Backend API
Open a new terminal:
```bash
cd backend
npm install
npm start
```

---

### 3. Start Frontend UI
Open another new terminal:
```bash
cd frontend
npm install
npm start
```

---

## **Features**

- **Account Management**  
  Support for multiple account types with real-time balance updates.

- **Transaction Management**  
  Track income, expenses, and transfers between multiple accounts.

- **Budget & Goal Tracking**  
  Set and monitor budgets and savings goals.

- **Financial Analytics & Notification**  
  Monthly summaries, spending categorization, and income vs. expense insights with notification for repayments.

- **Loan Calculator**  
  Automatically compute interest and repayment schedules.

---

## **Tech Stack**

| Layer | Technology |
|-------|------------|
| **Frontend** | ReactJS, HTML, CSS |
| **Backend** | Node.js, Express.js |
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
- Updates account balances automatically  
- Handles transfers with rollback on error  

### Triggers
- Validates transaction data before commit  
- Auto-updates account balance after transactions  
- Logs changes to critical tables  

### Sample Queries
- Categorized monthly expenses  
- Income vs. expense trends over time  
- Loan repayment calculations with interest  

---

## Team Members

- [Juhan Ahmed](https://github.com/juhanjarif)
- [Tanvir Mahmud Hossain](https://github.com/Tamajose) 
- [Aakash Abdullah Siddhartha](https://github.com/Arceus-221)  

---