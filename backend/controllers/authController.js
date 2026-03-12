const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');

const loginAttempts = new Map();

function getRateLimitKey(req, identifier) {
  return `${req.ip}|${identifier}`;
}
function checkRateLimit(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, firstAt: now, blockedUntil: 0 };
  if (entry.blockedUntil > now) return { blocked: true, secsLeft: Math.ceil((entry.blockedUntil - now) / 1000) };
  if (now - entry.firstAt > 60_000) loginAttempts.set(key, { count: 0, firstAt: now, blockedUntil: 0 });
  return { blocked: false };
}
function recordFailedAttempt(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, firstAt: now, blockedUntil: 0 };
  if (now - entry.firstAt > 60_000) { loginAttempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 }); return; }
  const count = entry.count + 1;
  loginAttempts.set(key, { ...entry, count, blockedUntil: count >= 5 ? now + 60_000 : 0 });
}
function clearAttempts(key) { loginAttempts.delete(key); }

async function writeLoginLog(userId, ip, status) {
  try {
    await db.query(`INSERT INTO login_logs (user_id, ip_address, status) VALUES ($1,$2,$3)`, [userId || null, ip, status]);
  } catch (e) { console.warn('Login log skipped:', e.message); }
}

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    if ((await db.query('SELECT id FROM users WHERE username = $1', [username])).rows.length > 0)
      return res.status(400).json({ success: false, message: 'Username already exists' });
    if ((await db.query('SELECT id FROM users WHERE email = $1', [email])).rows.length > 0)
      return res.status(400).json({ success: false, message: 'Email already exists' });
    if (String(password).length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );
    const user = result.rows[0];
    return res.status(201).json({ success: true, message: 'Registration successful', data: { user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at }, token: generateToken(user.id) } });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { emailOrUsername, password, totp_code } = req.body;
  const ip = req.ip;
  if (!emailOrUsername || !password)
    return res.status(400).json({ success: false, message: 'Email/username and password are required' });

  const rlKey = getRateLimitKey(req, emailOrUsername);
  const rl = checkRateLimit(rlKey);
  if (rl.blocked) {
    await writeLoginLog(null, ip, 'blocked');
    return res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${rl.secsLeft} seconds.`, retry_after: rl.secsLeft });
  }

  try {
    const result = await db.query(
      `SELECT id, username, email, password, twofa_secret, twofa_enabled, created_at FROM users WHERE email = $1 OR username = $1`,
      [emailOrUsername]
    );
    if (result.rows.length === 0) {
      recordFailedAttempt(rlKey);
      await writeLoginLog(null, ip, 'failed_user_not_found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password)) {
      recordFailedAttempt(rlKey);
      await writeLoginLog(user.id, ip, 'failed_wrong_password');
      const remaining = Math.max(0, 5 - (loginAttempts.get(rlKey)?.count || 0));
      return res.status(401).json({ success: false, message: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
    }
    if (user.twofa_enabled && user.twofa_secret) {
      if (!totp_code) return res.status(200).json({ success: false, requires_2fa: true, message: 'Please enter your 2FA code from your authenticator app' });
      if (!verifyTOTP(user.twofa_secret, totp_code)) {
        recordFailedAttempt(rlKey);
        await writeLoginLog(user.id, ip, 'failed_2fa');
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }
    clearAttempts(rlKey);
    await writeLoginLog(user.id, ip, 'success');
    return res.status(200).json({ success: true, message: 'Login successful', data: { user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at, twofa_enabled: user.twofa_enabled }, token: generateToken(user.id) } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const getCurrentUser = async (req, res) => {
  try { return res.status(200).json({ success: true, data: { user: req.user } }); }
  catch (error) { return res.status(500).json({ success: false, message: 'Failed to get user data' }); }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    const result = await db.query('SELECT id, username FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(`DELETE FROM password_resets WHERE user_id = $1`, [user.id]);
    await db.query(`INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)`, [user.id, token, expiresAt]);

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    console.log(`[PASSWORD RESET] User: ${user.username} | URL: ${resetUrl}`);

    try {
      await sendResetEmail(email, user.username, resetUrl);
      console.log(`[EMAIL SENT] to ${email}`);
    } catch (e) {
      console.error('Email send failed:', e.message);
    }

    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ success: false, message: 'Token and new password are required' });
  if (String(new_password).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  try {
    const result = await db.query(`SELECT user_id, expires_at FROM password_resets WHERE token = $1`, [token]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    const { user_id, expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [await bcrypt.hash(new_password, 10), user_id]);
    await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

const setupTOTP = async (req, res) => {
  try {
    const secret = generateTOTPSecret();
    const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    await db.query('UPDATE users SET twofa_secret = $1, twofa_enabled = false WHERE id = $2', [secret, req.user.id]);
    const otpauthUrl = `otpauth://totp/ThePulse:${encodeURIComponent(userRes.rows[0].email)}?secret=${secret}&issuer=ThePulse`;
    return res.json({ success: true, data: { secret, otpauth_url: otpauthUrl } });
  } catch (error) { return res.status(500).json({ success: false, message: 'Failed to setup 2FA' }); }
};

const verifyAndEnable2FA = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code is required' });
  try {
    const result = await db.query('SELECT twofa_secret FROM users WHERE id = $1', [req.user.id]);
    const secret = result.rows[0]?.twofa_secret;
    if (!secret) return res.status(400).json({ success: false, message: 'Please setup 2FA first' });
    if (!verifyTOTP(secret, code)) return res.status(401).json({ success: false, message: 'Invalid code' });
    await db.query('UPDATE users SET twofa_enabled = true WHERE id = $1', [req.user.id]);
    return res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) { return res.status(500).json({ success: false, message: 'Failed to verify 2FA' }); }
};

const disable2FA = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Password required' });
  try {
    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!await bcrypt.compare(password, result.rows[0].password)) return res.status(401).json({ success: false, message: 'Invalid password' });
    await db.query('UPDATE users SET twofa_secret = NULL, twofa_enabled = false WHERE id = $1', [req.user.id]);
    return res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) { return res.status(500).json({ success: false, message: 'Failed to disable 2FA' }); }
};

const getLoginHistory = async (req, res) => {
  try {
    const result = await db.query(`SELECT id, ip_address, status, created_at FROM login_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    return res.json({ success: true, data: { logs: result.rows } });
  } catch (error) { return res.status(500).json({ success: false, message: 'Failed to fetch login history' }); }
};

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function generateTOTPSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let s = '';
  for (let i = 0; i < length; i++) s += BASE32_CHARS[bytes[i] % 32];
  return s;
}
function base32Decode(secret) {
  let bits = 0, value = 0;
  const out = [];
  for (const c of secret.toUpperCase()) {
    const idx = BASE32_CHARS.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function generateTOTPCode(secret, ts) {
  const key = base32Decode(secret);
  const time = Buffer.alloc(8);
  time.writeUInt32BE(Math.floor(ts / 0x100000000), 0);
  time.writeUInt32BE(ts >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(time).digest();
  const off = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[off] & 0x7f) << 24 | (hmac[off+1] & 0xff) << 16 | (hmac[off+2] & 0xff) << 8 | (hmac[off+3] & 0xff)) % 1_000_000;
  return String(code).padStart(6, '0');
}
function verifyTOTP(secret, code) {
  const now = Math.floor(Date.now() / 30_000);
  for (let d = -1; d <= 1; d++) if (generateTOTPCode(secret, now + d) === String(code)) return true;
  return false;
}

async function sendResetEmail(to, username, resetUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL NOT SENT — add SMTP_USER/SMTP_PASS to .env]`);
    console.log(`[RESET URL]: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"The Pulse" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your Pulse password',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #f1f5f9;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;font-style:italic;color:#111">The Pulse</span>
          <span style="display:block;font-size:10px;letter-spacing:3px;color:#94a3b8;margin-top:2px">SMARTER PROJECT DNA</span>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px">Password Reset Request</h2>
        <p style="color:#64748b;margin:0 0 24px">Hi <b>${username}</b>, we received a request to reset your password.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#ef4444;color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:14px;letter-spacing:1px">
          RESET PASSWORD
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          This link expires in <b>1 hour</b> and can only be used once.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>`,
  });
}

module.exports = { register, login, getCurrentUser, forgotPassword, resetPassword, setupTOTP, verifyAndEnable2FA, disable2FA, getLoginHistory };