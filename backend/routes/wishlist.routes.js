const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All wishlist operations require an authenticated user
router.use(authMiddleware);

router.post("/", addToWishlist);
router.get("/", getWishlist);
router.delete("/:id", removeFromWishlist);

module.exports = router;
