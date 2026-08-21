const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Basic profile info
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },

    // Wallet & Escrow
    walletBalance: {
      type: Number,
      default: 100,
      min: 0,
    },
    escrowHeld: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Engineer Score (reputation)
    engineerScore: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
        min: 0,
      },
      bugsSolved: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Activity tracking
    tasksPosted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    tasksClaimed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    tasksCompleted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);