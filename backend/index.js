const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
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
const financialRoutes = require('./routes/financialRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`⚡ Client Connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their tactical room`);
  });

  socket.on('disconnect', () => {
    console.log('🔥 Client Disconnected');
  });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/myTasks', myTaskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects/:projectId/finance', financialRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'The Pulse Server is Online',
    timestamp: new Date().toISOString(),
    socket_status: 'Active'
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('SERVER_CRITICAL_ERROR:', err);
  const isDev = (process.env.NODE_ENV || 'development') === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

const start = async () => {
  try {
    await pool.query('SELECT 1');
    
    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🚀 THE PULSE COMMAND CENTER ONLINE 🚀           ║
║                                                          ║
║   Port: ${PORT}                                          ║
║   Database: ✅ CONNECTED                                 ║
║   WebSockets: ⚡ ENABLED (Socket.io)                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}  ║
║   Time: ${new Date().toLocaleString()}                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ DATABASE UPLINK FAILED:', err.message);
    process.exit(1);
  }
};

start();