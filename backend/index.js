const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const pool = require('./config/database');
const { metricsMiddleware, socketConnected, socketDisconnected } = require('./services/metricsStore');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const financialRoutes = require('./routes/financialRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pairingRoutes = require('./routes/paringRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`⚡ Client Connected: ${socket.id}`);
  socketConnected();

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their tactical room`);
  });

  socket.on('disconnect', () => {
    console.log('🔥 Client Disconnected');
    socketDisconnected();
  });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(metricsMiddleware());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/decisions', decisionRoutes);
app.use('/api/projects/:projectId/finance', financialRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pairing', pairingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'The Pulse Server is Online',
    timestamp: new Date().toISOString(),
    socket_status: 'Active'
  });
});

app.get('/api/health', (req, res) => {
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
║          🚀 THE PULSE COMMAND CENTER ONLINE 🚀           ║
║   Port: ${PORT}                                          ║
║   Database: ✅ CONNECTED                                 ║
║   WebSockets: ⚡ ENABLED                                  ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ DATABASE UPLINK FAILED:', err.message);
    process.exit(1);
  }
};

start();