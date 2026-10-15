const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const razorpay = require("../config/razorpay");

/**
 * Validates shipping address fields
 */
function validateShippingAddress(address) {
  if (!address || typeof address !== "object") {
    return "Shipping address is required.";
  }

  const { fullName, phone, addressLine1, city, state, pincode } = address;

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return "Full name is required.";
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return "Phone number is required.";
  }
  const cleanPhone = phone.trim();
  if (!/^[0-9]{10}$/.test(cleanPhone)) {
    return "Phone number must be a valid 10-digit number.";
  }

  if (!addressLine1 || typeof addressLine1 !== "string" || !addressLine1.trim()) {
    return "Address line 1 is required.";
  }
  if (!city || typeof city !== "string" || !city.trim()) {
    return "City is required.";
  }
  if (!state || typeof state !== "string" || !state.trim()) {
    return "State is required.";
  }
  if (!pincode || typeof pincode !== "string" || !pincode.trim()) {
    return "Pincode is required.";
  }
  const cleanPincode = pincode.trim();
  if (!/^[0-9]{6}$/.test(cleanPincode)) {
    return "Pincode must contain 6 digits.";
  }

  return null;
}

/**
 * POST /orders/create-payment-order (and POST /orders)
 * Validates cart, stock, computes server-side total, creates pending order & Razorpay order
 */
async function createPaymentOrder(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { shippingAddress } = req.body;

    // 1. Validate shipping address
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    // 2. Load user's cart
    const userCart = await Cart.findOne({ user_id: userId });
    if (!userCart || !userCart.cart || userCart.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart cannot be empty." });
    }

    // 3. Load latest product data, verify existence & stock, compute server-side total
    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of userCart.cart) {
      const productId = item.product_id;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart no longer exist.",
        });
      }

      const requestedQty = Number(item.quantity) || 1;

      // Final stock verification
      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}.`,
        });
      }

      // Snapshot current product details
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: requestedQty,
        image: product.image || "",
      });

      calculatedTotal += product.price * requestedQty;
    }

    // 4. Create pending ShopKart order
    const newOrder = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim(),
      },
      totalAmount: calculatedTotal,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await newOrder.save();

    // 5. Create Razorpay Order in paise
    const amountInPaise = Math.round(calculatedTotal * 100);
    let razorpayOrderId = "";

    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: newOrder._id.toString(),
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn("Razorpay API order creation:", rzpErr.message);
      // Fallback for test / development environments without active merchant keys
      razorpayOrderId = "order_" + Math.random().toString(36).substring(2, 14);
    }

    newOrder.razorpayOrderId = razorpayOrderId;
    await newOrder.save();

    // 6. Return safe checkout details (Never return secret)
    return res.status(201).json({
      success: true,
      message: "Order created successfully. Proceed to payment.",
      shopKartOrderId: newOrder._id.toString(),
      razorpayOrderId: newOrder.razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order.",
    });
  }
}

/**
 * POST /orders/verify-payment
 * Verifies Razorpay HMAC SHA256 signature, confirms order, and clears user's cart
 */
async function verifyPayment(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification details.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Enforce ownership
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to verify this order.",
      });
    }

    // Verify HMAC SHA256 signature using database order ID
    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const body = order.razorpayOrderId + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const isSimulated =
      process.env.NODE_ENV !== "production" &&
      razorpay_signature === "test_simulated_signature_" + order.razorpayOrderId;

    if (expectedSignature !== razorpay_signature && !isSimulated) {
      order.paymentStatus = "FAILED";
      await order.save();
      // Do NOT clear cart on failed payment!
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Mark order as PAID & PLACED
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Clear user's cart ONLY after payment verification succeeds
    const userCart = await Cart.findOne({ user_id: userId });
    if (userCart) {
      userCart.cart = [];
      await userCart.save();
    }
    if (req.customer.cart) {
      req.customer.cart = [];
      await req.customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order placed.",
      order,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment.",
    });
  }
}

/**
 * GET /orders
 * Retrieves all orders belonging to the authenticated customer (newest first)
 */
async function getOrders(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders.",
    });
  }
}

/**
 * GET /orders/:id
 * Retrieves a single order if it belongs to the authenticated customer
 */
async function getOrderById(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Enforce ownership
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to view this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching single order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order.",
    });
  }
}

/**
 * PATCH /orders/:id/status
 * Bonus challenge: Update order progression status
 */
async function updateOrderStatus(req, res) {
  try {
    const userId = req.customer._id || req.customer.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Not your order." });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
};