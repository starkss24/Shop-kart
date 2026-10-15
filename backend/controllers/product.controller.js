const Product = require("../models/product.model");
const Wishlist = require("../models/wishlist.model")
const mongoose = require('mongoose')
async function addProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body

    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({ success: false, message: "All details required" })
    }

    const newProduct = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      image,
      stock: Number(stock),
      createdAt: new Date(),
    });

      
    return res.status(201).json({ success: true, message: "Product added successfully", product: newProduct })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to create product" })
  }
}


async function getProducts(req, res) {
  try {
    const { search, category } = req.query
    const filter = {}

    if (search && search.trim() !== "") {
      filter.name = { $regex: search.trim(), $options: "i" }
    }

    if (category && category.trim() !== "" && category.toLowerCase() !== "all categories") {
      filter.category = { $regex: `^${category.trim()}$`, $options: "i" }
    }

    const products = await Product.find(filter).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: "OOPS! Theres a server error." })
  }
}


async function getProductId(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    return res.status(200).json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch product", error: err.message })
  }
}

async function addToWishlist(req,res) {
    try {
      const id = req.params

      if (!mongoose.isObjectIdOrHexString(id)) {
        return res.status(400).json({error : "Bad request"})
      }

      const checkProduct = await Product.findById({id : id})

      if (!checkProduct) {
          return res.status(404).json({error : "Product not found"})
      }

      const isWishlisted = await Wishlist.findById({id : id})
      if (isWishlisted) {
          return res.status(409).json({error : "Product already wishlisted"})
      }

      const wishlist = await Wishlist.create({
        id
      })
      
      return res.status(201).json({message : "Wishlisted successfully"})
  } catch (err) {
    return res.status(500).json({ success: false, message: "OOPS! Theres a server error." })
  }
}

async function getWishlist(req,res) {
  try {
    const products = await Wishlist.find({})
    return res.status(200).json({messgae : 'Products fetched successfully',products : products})
  } catch (err) {
    return res.status(500).json({ success: false, message: "OOPS! Theres a server error." })
  }
}

async function deleteWishlist(req,res) {
  try {
    const id = req.params

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({message : "Bad request"})
    }

    const checkProduct = await Product.findById(id)

    if (!checkProduct) {
      return res.status(404).json({messgae : "Product not found"})
    }

    await Wishlist.deleteOne({id : id})

    return res.status(200).json({message : "Product removed from wishlist succesfully"})
  } catch (err) {
    return res.status(500).json({ success: false, message: "OOPS! Theres a server error." })
  }
}

module.exports = {
  addProduct,
  getProducts,
  getProductId,
};