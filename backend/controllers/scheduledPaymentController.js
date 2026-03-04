const ScheduledPayment = require("../models/scheduledPaymentModel");

exports.createScheduledPayment = async (req, res) => {
  try {
    const payment = await ScheduledPayment.create({
      ...req.body,
      user_id: req.user.id,
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({
      message: "Error creating scheduled payment",
      error: err.message,
    });
  }
};

exports.getScheduledPayments = async (req, res) => {
  try {
    const payments = await ScheduledPayment.getAllByUserId(req.user.id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching scheduled payments",
      error: err.message,
    });
  }
};

exports.updateScheduledPayment = async (req, res) => {
  try {
    const payment = await ScheduledPayment.update(req.params.id, req.body);
    res.json(payment);
  } catch (err) {
    res.status(500).json({
      message: "Error updating scheduled payment",
      error: err.message,
    });
  }
};

exports.deleteScheduledPayment = async (req, res) => {
  try {
    const result = await ScheduledPayment.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Error deleting scheduled payment",
      error: err.message,
    });
  }
};
