const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { validateChatAccess, saveChatMessage } = require('./controllers/chatController');
const { setSocketIO, createNotification } = require('./controllers/notificationController');

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

// Pass Socket.io instance to notification controller for real-time alerts
setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route to check if server is running
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running with Socket.io!' });
});

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Join user room for targeted notifications
  socket.on('join-user', (userId) => {
    if (userId) {
      const room = `user-${userId}`;
      socket.join(room);
      console.log(`🔔 User ${userId} joined room ${room}`);
    }
  });

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
      const access = validateChatAccess(taskId, userId);
      const savedChat = await saveChatMessage(taskId, userId, message);
      const roomName = `task-${taskId}`;
      
      // Broadcast to room (both sender and receiver)
      io.to(roomName).emit('receive-message', savedChat);

      // Trigger real-time notification to receiver
      if (access && access.otherUserId) {
        const { readDB } = require('./config/db');
        const db = readDB();
        const sender = (db.users || []).find(u => String(u.id) === String(userId));
        const senderName = sender ? sender.username : 'Someone';
        createNotification(
          access.otherUserId,
          'new_message',
          taskId,
          `New message from ${senderName}`,
          userId,
          {
            preview: message.length > 60 ? `${message.substring(0, 60)}...` : message,
            senderUsername: senderName,
            taskTitle: access.task?.title || 'Task',
          },
          `/messages`
        );
      }

      if (callback) callback({ success: true, message: savedChat });
    } catch (err) {
      console.error('Error saving socket message:', err.message);
      if (callback) callback({ error: err.message });
      socket.emit('chat-error', { message: err.message });
    }
  });

  // Real-time task-claimed event
  socket.on('task-claimed', ({ taskId, posterId, solverUsername }) => {
    if (posterId) {
      io.to(`user-${posterId}`).emit('notification', {
        type: 'task_claimed',
        message: `${solverUsername || 'A solver'} claimed your task`,
        taskId,
        createdAt: new Date().toISOString(),
      });
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