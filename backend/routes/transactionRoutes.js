const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, transactionController.createTransaction);
router.get("/", authenticateToken, transactionController.getTransactions);

router.get(
  "/summary/monthly",
  authenticateToken,
  transactionController.getMonthlySummary,
);

module.exports = router;
