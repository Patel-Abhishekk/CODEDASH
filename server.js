const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
require('dotenv').config(); // ✅ Load .env variables
const connectDB = require('./config/mongodb'); // ✅ Import MongoDB connection
const logger = require('./utils/logger');
const { setSocketIO } = require('./controllers/notificationController');
const { saveChatMessage } = require('./controllers/chatController');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// CORS Configuration (shared between Express and Socket.IO)
// ═══════════════════════════════════════════════════════════
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  /^http:\/\/192\.168\..*:3000$/,
  /^http:\/\/10\..*:3000$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return origin === allowed;
    })) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ═══════════════════════════════════════════════════════════
// SOCKET.IO SETUP
// ═══════════════════════════════════════════════════════════
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
});

// Pass io instance to notification controller for real-time pushes
setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their personal room for notifications
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined room user-${userId}`);
    }
  });

  // Handle real-time chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { taskId, senderId, message } = data;
      const savedMsg = await saveChatMessage(taskId, senderId, message);

      // Emit to both sender and receiver rooms
      io.to(`user-${savedMsg.senderId}`).to(`user-${savedMsg.receiverId}`).emit('new-message', savedMsg);
    } catch (error) {
      socket.emit('chat-error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════════
// CONNECT TO MONGODB ATLAS
// ═══════════════════════════════════════════════════════════
connectDB(); // ✅ Connect to MongoDB

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ═══════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ═══════════════════════════════════════════════════════════
// STRUCTURED REQUEST LOGGING
// ═══════════════════════════════════════════════════════════
app.use(logger.requestMiddleware);

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CodeDash API running with MongoDB Atlas',
    timestamp: new Date()
  });
});

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled request error', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔═════════════════════════════════════════════════════════╗');
  console.log('║ 🚀 CodeDash Backend Server Started (MongoDB Atlas) 🚀 ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🗄️  Database: MongoDB Atlas (Cloud)\n`);
  console.log('✅ Access URLs:');
  console.log(`   Localhost: http://localhost:${PORT}`);
  
  const interfaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(interfaces)) {
    addrs.forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`   Network:   http://${addr.address}:${PORT}`);
      }
    });
  }
  console.log('\n✅ Health Check: http://localhost:5000/api/health\n');
  console.log('Press Ctrl+C to stop the server\n');
});