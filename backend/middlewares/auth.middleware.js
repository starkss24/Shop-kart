const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

/**
 * Protects routes by verifying the JWT stored in the HttpOnly cookie.
 * Attaches the authenticated customer document to req.customer.
 */
async function authMiddleware(req, res, next) {
  try {
    // 1. Read token from cookie (fallback to Authorization header for flexibility)
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid or expired token.",
      });
    }

    // 3. Fetch customer and attach to request
    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Customer no longer exists.",
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
      error: error.message,
    });
  }
}

module.exports = authMiddleware;