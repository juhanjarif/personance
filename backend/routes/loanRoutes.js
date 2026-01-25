const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middleware/authMiddleware');

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        const jwt = require('jsonwebtoken');
        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                res.sendStatus(403);
            } else {
                req.user = authData;
                next();
            }
        });
    } else {
        res.sendStatus(401);
    }
};

router.post('/', verifyToken, loanController.createLoan);
router.get('/', verifyToken, loanController.getLoans);
router.delete('/:id', verifyToken, loanController.deleteLoan);
router.patch('/:id/status', verifyToken, loanController.updateLoanStatus);

module.exports = router;
