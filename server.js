const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const os = require('os');
require('dotenv').config(); // ✅ Load .env variables
const connectDB = require('./config/mongodb'); // ✅ Import MongoDB connection

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

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

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      /^http:\/\/192\.168\..*:3000$/,
      /^http:\/\/10\..*:3000$/,
    ];

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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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
// REQUEST LOGGING
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
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