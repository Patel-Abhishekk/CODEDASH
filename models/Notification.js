const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['task_claimed', 'proof_submitted', 'task_approved', 'task_rejected', 'task_abandoned', 'new_message'],
    required: true 
  },
  message: { type: String, required: true },
  taskId: String,
  relatedUserId: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
