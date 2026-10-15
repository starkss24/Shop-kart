const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
 
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://starkss24.github.io'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
 
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "ShopKart Auth API is running." });
});
 
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Direct aliases for tests calling without /api prefix
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});
 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong on the server." });
});
 
const PORT = process.env.PORT || 5001;
 
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4,
})
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`ShopKart auth server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });