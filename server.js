const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { validateChatAccess, saveChatMessage } = require('./controllers/chatController');

// Connect to MongoDB / JSON DB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);

// Test route to check if server is running
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running with Socket.io!' });
});

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Join task chat room
  socket.on('join-task', ({ taskId, userId }, callback) => {
    try {
      const access = validateChatAccess(taskId, userId);
      if (!access.valid) {
        if (callback) callback({ error: access.message });
        socket.emit('chat-error', { message: access.message });
        return;
      }

      const roomName = `task-${taskId}`;
      socket.join(roomName);
      console.log(`👤 User ${userId} joined room ${roomName}`);

      if (callback) {
        callback({ 
          success: true, 
          room: roomName,
          otherUser: {
            id: access.otherUserId,
            username: access.otherUsername,
          }
        });
      }
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // Send message
  socket.on('send-message', async ({ taskId, userId, message }, callback) => {
    try {
      const savedChat = await saveChatMessage(taskId, userId, message);
      const roomName = `task-${taskId}`;
      
      // Broadcast to room (both sender and receiver)
      io.to(roomName).emit('receive-message', savedChat);

      if (callback) callback({ success: true, message: savedChat });
    } catch (err) {
      console.error('Error saving socket message:', err.message);
      if (callback) callback({ error: err.message });
      socket.emit('chat-error', { message: err.message });
    }
  });

  // Typing indicator
  socket.on('user-typing', ({ taskId, userId, username }) => {
    socket.broadcast.to(`task-${taskId}`).emit('user-is-typing', {
      userId,
      username: username || 'User',
    });
  });

  // Stop typing indicator
  socket.on('stop-typing', ({ taskId, userId }) => {
    socket.broadcast.to(`task-${taskId}`).emit('user-stopped-typing', { userId });
  });

  // Leave task room
  socket.on('leave-task', ({ taskId }) => {
    socket.leave(`task-${taskId}`);
    console.log(`User left room task-${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔥 Socket disconnected: ${socket.id}`);
  });
});

// Start server with Socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server with Socket.io running on http://localhost:${PORT}`);
});