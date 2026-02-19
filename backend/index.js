const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const pool = require('./config/database'); // ✅ นำเข้า Database Pool

// ✅ Load .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const myTaskRoutes = require("./routes/myTaskRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes'); // ✅ เพิ่ม Dashboard Routes

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ Fail-fast checks
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
  process.exit(1);
}

// --- Middlewares ---
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/myTasks', myTaskRoutes);
app.use('/api/dashboard', dashboardRoutes); // ✅ เพิ่ม Dashboard Route
app.use('/api/tasks', taskRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('SERVER_CRITICAL_ERROR:', err);
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

// --- Startup with Database Check ---
const start = async () => {
  try {
    // ตรวจสอบการเชื่อมต่อฐานข้อมูลก่อนเริ่ม Server
    await pool.query('SELECT 1'); 
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║    🚀 THE PULSE SERVER IS ONLINE 🚀   ║
║                                       ║
║   Port: ${PORT}                      ║
║   Database: ✅ CONNECTED             ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║   Time: ${new Date().toLocaleString()}       ║
║                                       ║
╚═══════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ DATABASE UPLINK FAILED:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;