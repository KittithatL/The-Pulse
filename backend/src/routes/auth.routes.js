const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 chars" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(409).json({ message: "email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashed });
    return res.status(201).json({
      message: "register success",
      token: signToken(user),
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (e) {
    return res.status(500).json({ message: "server error", error: String(e.message || e) });
  }
});

// POST /api/auth/login  (email/username + password)
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (!login || !password) return res.status(400).json({ message: "login and password are required" });

    const user = await User.findOne({
      $or: [{ email: login.toLowerCase() }, { username: login }]
    });

    if (!user) return res.status(401).json({ message: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    return res.json({
      message: "login success",
      token: signToken(user),
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (e) {
    return res.status(500).json({ message: "server error", error: String(e.message || e) });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  return res.json({ user });
});

module.exports = router;
