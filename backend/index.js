const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// ✅ Load .env explicitly from /server/.env (กันกรณีรันจาก path อื่น)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ Fail-fast checks (กัน DB_PASSWORD undefined แล้วไปพังตอนใช้งานจริง)
const requiredEnv = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const missing = requiredEnv.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  for (const k of missing) console.error(`   - ${k}`);
  console.error('\n👉 Fix: create "server/.env" (not .env.example) and set these values.\n');
  // ไม่จำเป็นต้อง exit ถ้าอยากให้ server ยังรันได้ แต่แนะนำให้ exit เพื่อไม่ให้เจอ error ตอน runtime
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║                                       ║
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║   Time: ${new Date().toLocaleString()}       ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
