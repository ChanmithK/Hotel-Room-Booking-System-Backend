const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Creates a JWT using the user ID and secret
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Returns current user profile
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// Initial setup to create the first admin
const seedAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const admin = await User.create({
      name: "Admin User",
      email: "admin@kenora.com",
      password: "admin123",
      role: "admin",
    });
    res.status(201).json({ message: "Admin created", user: admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, getMe, seedAdmin };
