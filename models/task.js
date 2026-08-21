const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Task content
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
    },
    bounty: {
      type: Number,
      required: true,
      min: 1,
    },

    // Poster info
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Status machine
    status: {
      type: String,
      enum: ['open', 'claimed', 'under-review', 'approved', 'rejected', 'abandoned'],
      default: 'open',
    },

    // Claim tracking
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    claimDeadline: {
      type: Date,
      default: null,
    },

    // Proof of work & review
    proofOfWork: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },

    // Approval workflow
    approvedAt: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },

    // Escrow resolution tracking
    escrowResolved: {
      type: Boolean,
      default: false,
    },
    escrowResolvedAt: {
      type: Date,
      default: null,
    },
    escrowSplitRatio: {
      type: Object,
      default: null,
    },

    // Timestamps for automation
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);