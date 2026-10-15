const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductId,
} = require("../controllers/product.controller");

// Public endpoints for product browsing per lab spec
router.get("/", getProducts);
router.get("/:id", getProductId);
router.post("/", addProduct);

module.exports = router;