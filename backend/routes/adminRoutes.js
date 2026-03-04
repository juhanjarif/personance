const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/tallies/daily", adminController.getDailyTallies);
router.get("/tallies/monthly", adminController.getMonthlyTallies);
router.get("/transactions", adminController.getAllTransactions);
router.get("/audit-logs", adminController.getAuditLogs);

module.exports = router;
