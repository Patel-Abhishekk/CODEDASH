const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true },
  walletBalance: { type: Number, default: 1000 },
  escrowHeld: { type: Number, default: 0 },
  engineerScore: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    bugsSolved: { type: Number, default: 0 }
  },
  tasksPosted: [String],
  tasksClaimed: [String],
  tasksCompleted: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);