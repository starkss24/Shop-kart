const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  Home
} = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.get("/me", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logoutCustomer);

module.exports = router;