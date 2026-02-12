const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');

// ✅ ฟังก์ชันสมัครสมาชิก (Register)
const register = async (req, res) => {
  try {
    // 1. รับค่า name, email, password มาจากหน้าบ้าน
    const { name, email, password } = req.body; 

    // 2. ตรวจสอบค่าว่าง
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // 3. ✅ ตรวจสอบชื่อซ้ำ (ใช้คอลัมน์ name แทน username เพื่อแก้ ReferenceError)
    const nameCheck = await db.query(
      'SELECT id FROM users WHERE name = $1', 
      [name] 
    );

    if (nameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username (Name) already exists',
      });
    }

    // 4. ตรวจสอบอีเมลซ้ำ
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // 5. เข้ารหัสรหัสผ่าน
    const passwordHash = await bcrypt.hash(password, 10);

    // 6. ✅ บันทึกลง Database (ใช้คอลัมน์ name และเพิ่ม role 'USER')
    const result = await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.trim(), passwordHash, 'USER']
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error); 
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// ✅ ฟังก์ชันเข้าสู่ระบบ (Login)
const login = async (req, res) => {
  try {
    const { emailOrName, password } = req.body;
    const identifier = emailOrName || req.body.email || req.body.name;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Name and password are required' });
    }

    // ✅ ค้นหาโดยใช้คอลัมน์ name หรือ email
    const result = await db.query(
      'SELECT id, name, email, password, role, created_at FROM users WHERE email = $1 OR name = $1',
      [identifier.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { 
        user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
        token 
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: { user: result.rows[0] } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { register, login, getCurrentUser };