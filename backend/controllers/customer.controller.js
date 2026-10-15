const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const { generateToken, setTokenCookie } = require("../utils/generateToken");

const SALT_ROUNDS = 10;

async function registerCustomer(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;


    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, password and phone are all required.",
      });
    }


    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "A customer with this email already exists.",
      });
    }


    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);


    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });


    const token = generateToken(customer._id);
    setTokenCookie(res, token);


    return res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
      token, 
    });
  } catch (error) {

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A customer with this email already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
}


async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    
    const customer = await Customer.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(customer._id);
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
}


async function getProfile(req, res) {
  try {

    const customer = req.customer;

    return res.status(200).json({
      success: true,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile.",
      error: error.message,
    });
  }
}

async function logoutCustomer(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during logout.",
      error: error.message,
    });
  }
}

async function Home(req,res) {
  
}

module.exports = {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
};