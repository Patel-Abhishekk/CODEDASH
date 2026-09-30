const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, minlength: 10, maxlength: 1000 },
  bounty: { type: Number, required: true, min: 100, max: 100000 },
  postedBy: { type: String, required: true },
  status: { type: String, enum: ['open', 'claimed', 'under-review', 'approved', 'rejected', 'abandoned'], default: 'open' },
  claimedBy: String,
  claimedAt: Date,
  claimDeadline: Date,
  deadlineHours: { type: Number, min: 1, max: 48 },
  proofOfWork: String,
  submittedAt: Date,
  approvedAt: Date,
  rating: Number,
  escrowResolved: { type: Boolean, default: false },
  escrowResolvedAt: Date,
  escrowSplitRatio: Object,
  rejectionReason: String,
  rejectedAt: Date,
  rejectionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes
taskSchema.index({ status: 1 });
taskSchema.index({ postedBy: 1 });
taskSchema.index({ claimedBy: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);