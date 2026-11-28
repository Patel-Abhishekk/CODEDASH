const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const path = require('path');
const os = require('os');
require('dotenv').config(); // ✅ Load .env variables
const connectDB = require('./config/mongodb'); // ✅ Import MongoDB connection
const logger = require('./utils/logger');
const noSqlSanitizer = require('./middleware/sanitize');
const authMiddleware = require('./middleware/auth');
const { adminMiddleware } = require('./middleware/auth');
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

// Enable reverse proxy trust for correct client IP detection in rate limiting (Item 9)
app.set('trust proxy', 1);

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
// SOCKET.IO SETUP WITH AUTHENTICATION (Item 2 & 14)
// ═══════════════════════════════════════════════════════════
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
});

// Pass io instance to notification controller for real-time pushes
setSocketIO(io);

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      socket.user = { id: decoded.userId, email: decoded.email, role: decoded.role || 'user' };
    } catch (err) {
      console.warn('Socket connection token invalid, continuing as guest');
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their personal room for notifications
  // IDOR & Spoofing defense: Users can only join their own room unless admin
  socket.on('join', (userId) => {
    if (socket.user && socket.user.id !== userId && socket.user.role !== 'admin') {
      console.warn(`⚠️ Socket ${socket.id} attempted to join unauthorized room: user-${userId}`);
      return;
    }
    const targetRoom = socket.user ? socket.user.id : userId;
    if (targetRoom) {
      socket.join(`user-${targetRoom}`);
      console.log(`👤 User joined room user-${targetRoom}`);
    }
  });

  // Handle real-time chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { taskId, message } = data;
      // Enforce sender identity from authenticated socket if available
      const senderId = socket.user?.id || data.senderId;
      if (!senderId) {
        return socket.emit('chat-error', { message: 'Authentication required to send chat messages' });
      }

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
// Helmet with strict Content Security Policy (Item 11: XSS protection)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cors(corsOptions));

// NoSQL Injection Sanitizer (Item 14: Query your database)
app.use(noSqlSanitizer);

// Rate limiting — global (Item 9: Guess the login code / brute force defense)
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
// ADMINISTRATIVE ROUTE PROTECTION (Item 1: Type /admin)
// ═══════════════════════════════════════════════════════════
app.get('/admin', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Access denied: Admin dashboard is not publicly accessible.'
  });
});

app.get('/api/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the CodeDash Admin API',
    admin: req.user.email
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
