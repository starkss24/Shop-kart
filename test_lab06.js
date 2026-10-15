const path = require("path");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");

const Customer = require("./backend/models/customer.model");
const Product = require("./backend/models/product.model");
const Cart = require("./backend/models/cart.model");
const Order = require("./backend/models/order.model");

const orderRoutes = require("./backend/routes/order.routes");
const cartRoutes = require("./backend/routes/cart.routes");

async function runTests() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log("MongoDB connected successfully.");

  // Spin up temporary test server
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/orders", orderRoutes);
  app.use("/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/cart", cartRoutes);

  const server = app.listen(5099);
  const baseUrl = "http://localhost:5099";

  let testUserA, testUserB;
  let tokenA, tokenB;
  let testProduct1, testProduct2;

  try {
    // 1. Create or find test customers
    testUserA = await Customer.findOne({ email: "lab6_user_a@test.com" });
    if (!testUserA) {
      testUserA = await Customer.create({
        fullName: "User A",
        email: "lab6_user_a@test.com",
        password: "password123",
        phone: "9876543210"
      });
    }

    testUserB = await Customer.findOne({ email: "lab6_user_b@test.com" });
    if (!testUserB) {
      testUserB = await Customer.create({
        fullName: "User B",
        email: "lab6_user_b@test.com",
        password: "password123",
        phone: "9876543211"
      });
    }

    tokenA = jwt.sign({ id: testUserA._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    tokenB = jwt.sign({ id: testUserB._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 2. Create or find test products
    testProduct1 = await Product.findOne({ name: "Lab6 Mechanical Keyboard" });
    if (!testProduct1) {
      testProduct1 = await Product.create({
        name: "Lab6 Mechanical Keyboard",
        description: "Clicky switches",
        price: 2999,
        category: "Electronics",
        image: "https://example.com/kb.jpg",
        stock: 10
      });
    } else {
      testProduct1.stock = 10;
      testProduct1.price = 2999;
      await testProduct1.save();
    }

    testProduct2 = await Product.findOne({ name: "Lab6 Wireless Mouse" });
    if (!testProduct2) {
      testProduct2 = await Product.create({
        name: "Lab6 Wireless Mouse",
        description: "Optical mouse",
        price: 1499,
        category: "Electronics",
        image: "https://example.com/mouse.jpg",
        stock: 5
      });
    } else {
      testProduct2.stock = 5;
      testProduct2.price = 1499;
      await testProduct2.save();
    }

    const validAddress = {
      fullName: "Aarav Sharma",
      phone: "9876543210",
      addressLine1: "22 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001"
    };

    console.log("\n--- Starting Postman Plan Evaluation ---");

    // TEST 9: Unauthenticated request
    console.log("Running Test 9: Unauthenticated request...");
    const unauthRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAddress: validAddress })
    });
    console.log(`Test 9 Status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status !== 401) throw new Error("Test 9 failed");

    // TEST 1: Empty cart
    console.log("\nRunning Test 1: Empty cart...");
    await Cart.deleteOne({ user_id: testUserA._id });
    const emptyCartRes = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ shippingAddress: validAddress })
    });
    console.log(`Test 1 Status: ${emptyCartRes.status} (Expected: 400)`);
    const emptyData = await emptyCartRes.json();
    console.log(`Test 1 Message: ${emptyData.message}`);
    if (emptyCartRes.status !== 400) throw new Error("Test 1 failed");

    // Populate Cart for User A
    await Cart.create({
      user_id: testUserA._id,
      cart: [
        { product_id: testProduct1._id, quantity: 2 },
        { product_id: testProduct2._id, quantity: 1 }
      ]
    });

    // TEST 8: Fake total sent from frontend should be ignored
    console.log("\nRunning Test 8: Fake total sent from frontend...");
    const fakeTotalRes = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ shippingAddress: validAddress, totalAmount: 1 })
    });
    const fakeTotalData = await fakeTotalRes.json();
    console.log(`Test 8 Created Total: ₹${fakeTotalData.order.totalAmount} (Expected: 2999*2 + 1499 = 7497)`);
    console.log(`Test 8 Razorpay Amount in paise: ${fakeTotalData.amount} (Expected: 749700)`);
    if (fakeTotalData.order.totalAmount !== 7497 || fakeTotalData.amount !== 749700) {
      throw new Error("Test 8 failed: Server did not calculate proper total");
    }

    // TEST 2: Create payment order response check
    console.log("\nRunning Test 2: Create payment order structure...");
    console.log("ShopKart Order ID:", fakeTotalData.shopKartOrderId);
    console.log("Razorpay Order ID:", fakeTotalData.razorpayOrderId);
    console.log("Currency:", fakeTotalData.currency);
    if (!fakeTotalData.shopKartOrderId || !fakeTotalData.razorpayOrderId || !fakeTotalData.amount) {
      throw new Error("Test 2 failed: Missing fields in response");
    }

    // TEST 3: Cart before payment verification
    console.log("\nRunning Test 3: Cart before payment verification...");
    const cartBeforeRes = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const cartBeforeData = await cartBeforeRes.json();
    console.log(`Cart item count before verification: ${cartBeforeData.userCart.cart.length} (Expected: 2)`);
    if (cartBeforeData.userCart.cart.length !== 2) throw new Error("Test 3 failed: Cart was cleared prematurely!");

    // TEST B / Invalid Signature check:
    console.log("\nRunning Signature Verification with Invalid Signature...");
    const badVerifyRes = await fetch(`${baseUrl}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        shopKartOrderId: fakeTotalData.shopKartOrderId,
        razorpay_order_id: fakeTotalData.razorpayOrderId,
        razorpay_payment_id: "pay_fake123",
        razorpay_signature: "bad_signature"
      })
    });
    console.log(`Bad signature status: ${badVerifyRes.status} (Expected: 400)`);
    if (badVerifyRes.status !== 400) throw new Error("Invalid signature was not rejected!");

    // TEST 4: Verify successful payment
    console.log("\nRunning Test 4: Verify successful payment...");
    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const paymentId = "pay_valid123";
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(fakeTotalData.razorpayOrderId + "|" + paymentId)
      .digest("hex");

    const goodVerifyRes = await fetch(`${baseUrl}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        shopKartOrderId: fakeTotalData.shopKartOrderId,
        razorpay_order_id: fakeTotalData.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      })
    });
    const goodVerifyData = await goodVerifyRes.json();
    console.log(`Order status: ${goodVerifyData.order.status} (Expected: PLACED)`);
    console.log(`Payment status: ${goodVerifyData.order.paymentStatus} (Expected: PAID)`);
    if (goodVerifyData.order.status !== "PLACED" || goodVerifyData.order.paymentStatus !== "PAID") {
      throw new Error("Test 4 failed: Order not marked PAID / PLACED");
    }

    // TEST 5: Confirm cart cleared
    console.log("\nRunning Test 5: Confirm cart cleared...");
    const cartAfterRes = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const cartAfterData = await cartAfterRes.json();
    console.log(`Cart item count after verification: ${cartAfterData.userCart.cart.length} (Expected: 0)`);
    if (cartAfterData.userCart.cart.length !== 0) throw new Error("Test 5 failed: Cart was not cleared");

    // TEST 6: Get Orders
    console.log("\nRunning Test 6: Get Orders...");
    const ordersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const ordersData = await ordersRes.json();
    console.log(`Found ${ordersData.orders.length} order(s). Top order status: ${ordersData.orders[0].status}`);
    if (!ordersData.orders || ordersData.orders.length === 0) throw new Error("Test 6 failed: Order not found");

    // TEST 10: Access another user's order
    console.log("\nRunning Test 10: Access another user's order...");
    const forbiddenRes = await fetch(`${baseUrl}/orders/${fakeTotalData.shopKartOrderId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log(`User B accessing User A order status: ${forbiddenRes.status} (Expected: 403 or 404)`);
    if (forbiddenRes.status !== 403 && forbiddenRes.status !== 404) {
      throw new Error("Test 10 failed: Cross-user access allowed");
    }

    // TEST 7: Insufficient stock
    console.log("\nRunning Test 7: Insufficient stock...");
    // Set product stock lower than cart qty
    testProduct1.stock = 1;
    await testProduct1.save();

    await Cart.findOneAndUpdate(
      { user_id: testUserA._id },
      { cart: [{ product_id: testProduct1._id, quantity: 3 }] },
      { upsert: true }
    );

    const stockFailRes = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ shippingAddress: validAddress })
    });
    console.log(`Insufficient stock status: ${stockFailRes.status} (Expected: 400)`);
    const stockFailData = await stockFailRes.json();
    console.log(`Insufficient stock message: "${stockFailData.message}"`);
    if (stockFailRes.status !== 400 || !stockFailData.message.includes("Insufficient stock")) {
      throw new Error("Test 7 failed: Stock check did not reject");
    }

    console.log("\n==========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100/100 🎉");
    console.log("==========================================\n");

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
