const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
  }

  const hashed = await bcrypt.hash(password, 10);

  // mock data
  res.json({
    message: "Register success (mock)",
    user: {
      username,
      email,
      password: hashed,
      role: "staff",
    },
  });
});

module.exports = router;
