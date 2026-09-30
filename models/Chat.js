const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes
chatSchema.index({ taskId: 1, createdAt: -1 });
chatSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('Chat', chatSchema);
