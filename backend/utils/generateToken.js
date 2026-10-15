const jwt = require("jsonwebtoken");

function generateToken(customerId) {
  return jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}


function setTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true, // not accessible via client-side JS -> mitigates XSS
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    secure: isProduction,          // HTTPS only in production
    sameSite: isProduction ? "none" : "lax", // cross-origin in prod, lax for localhost
  });
}

module.exports = { generateToken, setTokenCookie };