const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

async function addToCart(req, res) {
  try {
    const user_id = req.customer._id || req.customer.id
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    let userCart = await Cart.findOne({ user_id });
    if (!userCart) {
      userCart = new Cart({ user_id, cart: [] });
    }

    const item = userCart.cart.find((i) => i.product_id.toString() === product_id);

    if (item) {
      item.quantity += 1;
    } else {
      userCart.cart.push({ product_id, quantity: 1 });
    }

    product.stock -= 1;
    await product.save();
    await userCart.save();
    await userCart.populate("cart.product_id");

    return res.status(200).json({ success: true, message: "Cart updated", userCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to add to cart" });
  }
}

async function getCart(req, res) {
  try {
    const user_id = req.customer._id || req.customer.id
    let userCart = await Cart.findOne({ user_id }).populate("cart.product_id");

    if (!userCart) {
      return res.status(200).json({
        success: true,
        message: "Cart is Empty",
        userCart: { user_id, cart: [] },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully returned cart",
      userCart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to retrieve cart" });
  }
}

async function updateCart(req, res) {
  try {
    const user_id = req.customer._id || req.customer.id
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: "Product ID and quantity are required" });
    }

    const newQty = parseInt(quantity);
    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let userCart = await Cart.findOne({ user_id });
    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = userCart.cart.find((i) => i.product_id.toString() === product_id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    const diff = newQty - item.quantity;
    if (diff > 0) {
      if (product.stock < diff) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} more items in stock` });
      }
      product.stock -= diff;
      await product.save();
    } else if (diff < 0) {
      product.stock += Math.abs(diff);
      await product.save();
    }

    item.quantity = newQty;
    await userCart.save();
    await userCart.populate("cart.product_id");

    return res.status(200).json({ success: true, message: "Cart updated successfully", userCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update cart" });
  }
}

async function deleteItem(req, res) {
  try {
    const user_id = req.customer._id || req.customer.id
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    let userCart = await Cart.findOne({ user_id });
    if (!userCart) {
      return res.status(404).json({ success: false, message: "User cart not found" });
    }

    const item = userCart.cart.find((i) => i.product_id.toString() === product_id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    // Restore stock
    const product = await Product.findById(product_id);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }

    userCart.cart = userCart.cart.filter((i) => i.product_id.toString() !== product_id);
    await userCart.save();
    await userCart.populate("cart.product_id");

    return res.status(200).json({ success: true, message: "Item deleted successfully", userCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to remove item" });
  }
}

module.exports = { addToCart, getCart, updateCart, deleteItem };