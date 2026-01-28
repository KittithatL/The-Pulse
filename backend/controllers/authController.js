const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');


const register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;


    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }


    const usernameCheck = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }


    const emailCheck = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }


    const password_hash = await bcrypt.hash(password, 10);


    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, username, email, full_name, created_at`,
      [username, email, password_hash, full_name || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.user_id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};


const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required',
      });
    }


    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [emailOrUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = result.rows[0];


    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }


    const token = generateToken(user.user_id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};


const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data',
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
