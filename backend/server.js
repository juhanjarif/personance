const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Personance API is running');
});

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const financialRoutes = require('./routes/financialRoutes');
const loanRoutes = require('./routes/loanRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/finance', financialRoutes);
app.use('/api/loans', loanRoutes);

app.get('/reset-db', async (req, res) => {
    try {
        const db = require('./db');
        const fs = require('fs');
        const path = require('path');

        console.log('Resetting DB...');

        const sql1Path = path.join(__dirname, '../database/01_init.sql');
        const sql2Path = path.join(__dirname, '../database/02_procedures_triggers.sql');

        console.log('Reading:', sql1Path);
        const sql1 = fs.readFileSync(sql1Path, 'utf8');
        console.log('Reading:', sql2Path);
        const sql2 = fs.readFileSync(sql2Path, 'utf8');

        console.log('Executing 01_init.sql...');
        await db.query(sql1);
        console.log('Executing 02_procedures_triggers.sql...');
        await db.query(sql2);

        console.log('DB Reset Successful');
        res.send('Database reset successfully');
    } catch (err) {
        console.error('DB Reset ERROR:', err);
        res.status(500).send('Error resetting database: ' + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
