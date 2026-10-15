const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");

// Order creation & payment init
router.post("/create-payment-order", auth, createPaymentOrder);
router.post("/", auth, createPaymentOrder);

// Payment signature verification & order confirmation
router.post("/verify-payment", auth, verifyPayment);

// Order history & single order
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);

// Bonus: status progression
router.patch("/:id/status", auth, updateOrderStatus);

module.exports = router;
