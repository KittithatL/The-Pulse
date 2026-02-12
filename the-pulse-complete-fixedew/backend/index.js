const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const pool = require('./config/database');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const myTaskRoutes = require("./routes/myTaskRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// --- Middlewares ---
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/myTasks', myTaskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);

// --- Error Handling ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('SERVER_CRITICAL_ERROR:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal error' });
});

// --- Startup with DB Check ---
const start = async () => {
  try {
    await pool.query('SELECT 1'); // เช็ค DB ก่อน
    console.log('✅ DATABASE LINK ESTABLISHED');
    app.listen(PORT, () => console.log(`🚀 COMMAND CENTER ONLINE ON PORT ${PORT}`));
  } catch (err) {
    console.error('❌ DATABASE UPLINK FAILED:', err.message);
    process.exit(1);
  }
};

start();