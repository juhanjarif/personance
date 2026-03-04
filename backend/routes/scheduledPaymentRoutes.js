const express = require("express");
const router = express.Router();
const scheduledPaymentController = require("../controllers/scheduledPaymentController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", scheduledPaymentController.createScheduledPayment);
router.get("/", scheduledPaymentController.getScheduledPayments);
router.put("/:id", scheduledPaymentController.updateScheduledPayment);
router.delete("/:id", scheduledPaymentController.deleteScheduledPayment);

module.exports = router;
