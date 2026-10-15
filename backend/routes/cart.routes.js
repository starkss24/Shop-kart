const express = require('express');
const router = express.Router();

const { addToCart, getCart, updateCart, deleteItem } = require("../controllers/cart.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/addToCart", auth, addToCart);
router.get("/getCart", auth, getCart);
router.patch("/updateCart", auth, updateCart);
router.delete("/deleteItem", auth, deleteItem);

// Standard aliases
router.get("/", auth, getCart);
router.post("/", auth, addToCart);

module.exports = router;