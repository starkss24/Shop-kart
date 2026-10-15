const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");

async function addToWishlist(req, res) {
  try {
    const customerId = req.customer._id || req.customer.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existing = await Wishlist.findOne({ customer: customerId, product: productId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    const wishlistItem = await Wishlist.create({
      customer: customerId,
      product: productId,
    });

    const populatedItem = await Wishlist.findById(wishlistItem._id).populate("product");

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlistItem: populatedItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to add to wishlist" });
  }
}

async function getWishlist(req, res) {
  try {
    const customerId = req.customer._id || req.customer.id;
    const items = await Wishlist.find({ customer: customerId })
      .populate("product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      wishlist: items,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to retrieve wishlist" });
  }
}

async function removeFromWishlist(req, res) {
  try {
    const customerId = req.customer._id || req.customer.id;
    const { id } = req.params;

    let deletedItem = await Wishlist.findOneAndDelete({ _id: id, customer: customerId });
    if (!deletedItem) {
      deletedItem = await Wishlist.findOneAndDelete({ product: id, customer: customerId });
    }

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Wishlist item not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      id: deletedItem._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to remove from wishlist" });
  }
}

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
