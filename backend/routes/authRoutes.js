const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// test route
router.get('/test', (req, res) => {
  res.send("API working");
});

// register
router.post('/register', authController.register);

// login
router.post('/login', authController.login);

module.exports = router;