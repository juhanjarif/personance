const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticateToken = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/tallies/daily", adminController.getDailyTallies);
router.get("/tallies/monthly", adminController.getMonthlyTallies);
router.get("/transactions", adminController.getAllTransactions);

module.exports = router;
