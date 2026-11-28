const Task = require('../models/Task');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificationController');
const { sanitizeInput, escapeRegex, validateBounty, validateDeadlineHours, validateRating } = require('../utils/validation');

const postTask = async (req, res) => {
  try {
    const { title, description, bounty, deadlineHours } = req.body;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;

    if (!title || !description || bounty === undefined || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Business Logic / Edit Price & Order -1 Items - Items 4 & 5: Validate bounty strictly
    if (!validateBounty(bounty)) {
      return res.status(400).json({ success: false, message: 'Bounty must be ₹100-₹100,000' });
    }
    const numBounty = Number(bounty);

    const hours = deadlineHours ? Number(deadlineHours) : 2;
    if (!validateDeadlineHours(hours)) {
      return res.status(400).json({ success: false, message: 'Deadline hours must be between 1 and 48' });
    }

    // Race Condition Defense - Item 7: Atomically deduct balance only if walletBalance >= bounty
    const user = await User.findOneAndUpdate(
      { id: userId, walletBalance: { $gte: numBounty } },
      { $inc: { walletBalance: -numBounty, escrowHeld: numBounty } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const newTask = new Task({
      id: uuidv4(),
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      bounty: numBounty,
      postedBy: userId,
      deadlineHours: hours,
      status: 'open'
    });

    try {
      await newTask.save();
      await User.findOneAndUpdate({ id: userId }, { $push: { tasksPosted: newTask.id } });
    } catch (saveError) {
      // Roll back atomic deduction if task creation fails
      await User.findOneAndUpdate(
        { id: userId },
        { $inc: { walletBalance: numBounty, escrowHeld: -numBounty } }
      );
      throw saveError;
    }

    console.log(`✅ Task posted: ${title} by ${userId}`);
    res.status(201).json({ success: true, message: 'Task posted successfully', task: newTask });
  } catch (error) {
    console.error('Post task error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const enrichTasksBatch = async (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  const userIds = new Set();
  tasks.forEach((t) => {
    if (t.postedBy) userIds.add(t.postedBy);
    if (t.claimedBy) userIds.add(t.claimedBy);
  });

  const users = await User.find({ id: { $in: Array.from(userIds) } }, 'id username');
  const userMap = new Map();
  users.forEach((u) => userMap.set(u.id, u.username));

  return tasks.map((task) => {
    const taskObj = typeof task.toObject === 'function' ? task.toObject() : task;
    return {
      ...taskObj,
      postedByUsername: userMap.get(task.postedBy) || 'Unknown',
      claimedByUsername: task.claimedBy ? (userMap.get(task.claimedBy) || null) : null,
    };
  });
};

const enrichTask = async (task) => {
  if (!task) return task;
  const [enriched] = await enrichTasksBatch([task]);
  return enriched;
};

const getOpenTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ status: 'open' }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Task.countDocuments({ status: 'open' });

    const enrichedTasks = await enrichTasksBatch(tasks);

    res.json({
      success: true,
      message: 'Open tasks fetched',
      tasks: enrichedTasks,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    if (typeof taskId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOne({ id: taskId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const enrichedTask = await enrichTask(task);
    res.json({ success: true, message: 'Task fetched', task: enrichedTask });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const claimTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing or invalid task ID' });
    }

    const taskCheck = await Task.findOne({ id: taskId });
    if (!taskCheck) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (taskCheck.postedBy === userId) {
      return res.status(400).json({ success: false, message: 'You cannot claim your own task' });
    }

    const deadlineMs = (taskCheck.deadlineHours || 2) * 60 * 60 * 1000;
    const claimedAt = new Date();
    const claimDeadline = new Date(Date.now() + deadlineMs);

    // Race Condition Defense - Item 7: Atomic compare-and-swap
    // Only ONE concurrent request can claim the task where status === 'open'
    const task = await Task.findOneAndUpdate(
      { id: taskId, status: 'open', postedBy: { $ne: userId } },
      {
        $set: {
          status: 'claimed',
          claimedBy: userId,
          claimedAt: claimedAt,
          claimDeadline: claimDeadline
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(400).json({ success: false, message: 'Task already claimed' });
    }

    await User.findOneAndUpdate({ id: userId }, { $addToSet: { tasksClaimed: taskId } });
    const user = await User.findOne({ id: userId });

    await createNotification(
      task.postedBy,
      'task_claimed',
      task.id,
      `${user ? user.username : 'A developer'} claimed your task: ${task.title}`,
      userId,
      {
        taskTitle: task.title,
        solverUsername: user ? user.username : 'A developer',
        bounty: task.bounty,
        deadlineHours: task.deadlineHours || 2,
      },
      `/task/${task.id}`
    );

    console.log(`✅ Task claimed: ${taskId} by ${userId}`);
    res.json({
      success: true,
      message: 'Task claimed successfully',
      task,
      claimedAt: task.claimedAt,
      claimDeadline: task.claimDeadline
    });
  } catch (error) {
    console.error('Claim task error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitProof = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;
    const { proofOfWork } = req.body;

    if (!taskId || !proofOfWork || typeof proofOfWork !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const cleanProof = sanitizeInput(proofOfWork);
    if (cleanProof.length < 10) {
      return res.status(400).json({ success: false, message: 'Proof of work must be at least 10 characters' });
    }

    const existingTask = await Task.findOne({ id: taskId });
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (existingTask.claimedBy !== userId) {
      return res.status(400).json({ success: false, message: 'Only the claimer can submit proof' });
    }

    if (new Date() > existingTask.claimDeadline) {
      await Task.findOneAndUpdate(
        { id: taskId, status: 'claimed' },
        {
          $set: {
            status: 'open',
            claimedBy: null,
            claimedAt: null,
            claimDeadline: null
          }
        }
      );
      return res.status(400).json({ success: false, message: 'Claim deadline has passed. Task reverted to open.' });
    }

    // Race Condition Defense - Item 7: Atomic status transition from claimed to under-review
    const task = await Task.findOneAndUpdate(
      { id: taskId, claimedBy: userId, status: 'claimed' },
      {
        $set: {
          proofOfWork: cleanProof,
          submittedAt: new Date(),
          status: 'under-review'
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(400).json({ success: false, message: 'Task must be in claimed status' });
    }

    const solver = await User.findOne({ id: userId });
    await createNotification(
      task.postedBy,
      'proof_submitted',
      task.id,
      `${solver ? solver.username : 'Solver'} submitted proof for: ${task.title}`,
      userId,
      {
        taskTitle: task.title,
        solverUsername: solver ? solver.username : 'Solver',
        status: 'under-review',
      },
      `/approve-task/${task.id}`
    );

    res.status(200).json({
      success: true,
      message: 'Proof of work submitted successfully',
      task,
      submittedAt: task.submittedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;
    const rating = req.body?.rating;

    if (!taskId || rating === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Business Logic / Input Validation - Item 5: Validate rating strictly
    if (!validateRating(rating)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    const cleanRating = Number(rating);

    // Race Condition Defense - Item 7 (Redeem 100 times / Double payout protection):
    // Atomically transition status from 'under-review' to 'approved'.
    // Only the single winning request will match and modify the document.
    const task = await Task.findOneAndUpdate(
      { id: taskId, postedBy: userId, status: 'under-review' },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          rating: cleanRating,
          escrowResolved: true,
          escrowResolvedAt: new Date()
        }
      },
      { new: true }
    );

    if (!task) {
      const checkTask = await Task.findOne({ id: taskId });
      if (!checkTask) return res.status(404).json({ success: false, message: 'Task not found' });
      if (checkTask.postedBy !== userId) return res.status(400).json({ success: false, message: 'Only the poster can approve this task' });
      return res.status(400).json({ success: false, message: 'Task must be under review to approve' });
    }

    // Atomic financial resolution (Single execution guaranteed by atomic state change)
    const solver = await User.findOne({ id: task.claimedBy });
    if (!solver) return res.status(404).json({ success: false, message: 'Solver not found' });

    const poster = await User.findOne({ id: task.postedBy });
    if (!poster) return res.status(404).json({ success: false, message: 'Poster not found' });

    solver.walletBalance += task.bounty;
    solver.tasksCompleted.push(taskId);
    solver.engineerScore.bugsSolved = (solver.engineerScore.bugsSolved || 0) + 1;

    const totalRatings = solver.engineerScore.totalRatings || 0;
    const currentAvg = solver.engineerScore.averageRating || 0;
    const newAvg = (currentAvg * totalRatings + cleanRating) / (totalRatings + 1);
    solver.engineerScore.averageRating = parseFloat(newAvg.toFixed(2));
    solver.engineerScore.totalRatings = totalRatings + 1;
    await solver.save();

    await User.findOneAndUpdate(
      { id: task.postedBy, escrowHeld: { $gte: task.bounty } },
      { $inc: { escrowHeld: -task.bounty } }
    );

    await createNotification(
      task.claimedBy,
      'task_approved',
      task.id,
      `${poster.username} approved your work on: ${task.title}`,
      poster.id,
      {
        taskTitle: task.title,
        posterUsername: poster.username,
        rating: cleanRating,
        earned: task.bounty,
      },
      `/task/${task.id}`
    );

    res.status(200).json({
      success: true,
      message: 'Task approved successfully',
      task,
      solverScore: solver.engineerScore,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkAndResolveGhostingCore = async (autoResolve = false) => {
  const currentTime = new Date();
  const underReviewTasks = await Task.find({ status: 'under-review' });

  let resolvedCount = 0;
  const resolvedTasksList = [];

  for (const task of underReviewTasks) {
    const submittedTime = new Date(task.submittedAt);
    const hoursElapsed = (currentTime - submittedTime) / (1000 * 60 * 60);

    if (hoursElapsed > 48) {
      // Atomic compare-and-swap so concurrent background jobs don't double split
      const updatedTask = await Task.findOneAndUpdate(
        { id: task.id, status: 'under-review' },
        {
          $set: {
            status: 'abandoned',
            escrowResolved: true,
            escrowResolvedAt: currentTime,
            escrowSplitRatio: {
              solverPercentage: 50,
              posterPercentage: 50,
            }
          }
        },
        { new: true }
      );

      if (!updatedTask) continue; // Already handled by another thread

      const halfBounty = Math.floor(task.bounty / 2);

      const solver = await User.findOne({ id: task.claimedBy });
      const poster = await User.findOne({ id: task.postedBy });

      if (solver && poster) {
        solver.walletBalance += halfBounty;
        solver.tasksCompleted.push(task.id);
        solver.engineerScore.bugsSolved = (solver.engineerScore.bugsSolved || 0) + 1;
        await solver.save();

        poster.walletBalance += halfBounty;
        poster.escrowHeld = Math.max(0, poster.escrowHeld - task.bounty);
        await poster.save();

        await createNotification(
          task.postedBy,
          'task_abandoned',
          task.id,
          `Task abandoned (48h timeout): ${task.title}. 50/50 split applied.`,
          task.claimedBy,
          { taskTitle: task.title, splitAmount: halfBounty, totalBounty: task.bounty },
          `/task/${task.id}`
        );

        await createNotification(
          task.claimedBy,
          'task_abandoned',
          task.id,
          `Task abandoned (48h timeout): ${task.title}. 50/50 split applied.`,
          task.postedBy,
          { taskTitle: task.title, splitAmount: halfBounty, totalBounty: task.bounty },
          `/task/${task.id}`
        );

        resolvedCount++;
        resolvedTasksList.push({
          id: task.id,
          title: task.title,
          bounty: task.bounty,
          refund: halfBounty,
          solverPayment: halfBounty,
        });
      }
    }
  }
  return { resolvedCount, resolvedTasksList };
};

// Item 1: Access Control & Privilege Escalation - Protected RBAC admin action
const checkAndResolveGhosting = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
    }
    const { resolvedCount } = await checkAndResolveGhostingCore();
    res.status(200).json({
      message: `Ghosting check complete. ${resolvedCount} task(s) auto-resolved with 50/50 split.`,
      resolvedTasks: resolvedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const autoResolveGhosting = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
    }
    const { resolvedCount, resolvedTasksList } = await checkAndResolveGhostingCore();
    console.log(`Auto-resolved ${resolvedCount} abandoned tasks`);
    res.status(200).json({
      message: `Checked ghosting. ${resolvedCount} task(s) auto-resolved with 50/50 split.`,
      resolvedCount,
      resolvedTasks: resolvedTasksList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing or invalid task ID' });
    }

    // Race Condition Defense - Item 7 (Redeem 100 times / Double refund prevention):
    // Atomically delete only if status === 'open' and postedBy === userId
    const task = await Task.findOneAndDelete({ id: taskId, postedBy: userId, status: 'open' });
    if (!task) {
      const existing = await Task.findOne({ id: taskId });
      if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });
      if (existing.postedBy !== userId) {
        return res.status(403).json({ success: false, message: 'Only the task poster can delete this task' });
      }
      return res.status(400).json({ success: false, message: 'Only open tasks can be deleted' });
    }

    // Atomically refund escrow to user wallet
    const user = await User.findOneAndUpdate(
      { id: userId },
      {
        $inc: { walletBalance: task.bounty, escrowHeld: -task.bounty },
        $pull: { tasksPosted: taskId }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body?.taskId;
    // IDOR Protection - Item 2: Always use authenticated user's ID
    const userId = req.user.id;
    const { rejectionReason } = req.body;

    if (!taskId || !rejectionReason || typeof rejectionReason !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // XSS Protection - Item 11: Sanitize rejection reason
    const cleanReason = sanitizeInput(rejectionReason);
    if (cleanReason.length < 10) {
      return res.status(400).json({ success: false, message: 'Rejection reason must be at least 10 characters' });
    }

    // Race Condition Defense - Item 7: Atomic compare-and-swap
    const task = await Task.findOneAndUpdate(
      { id: taskId, postedBy: userId, status: 'under-review' },
      {
        $set: {
          status: 'claimed',
          proofOfWork: null,
          submittedAt: null,
          rejectionReason: cleanReason,
          rejectedAt: new Date()
        },
        $inc: { rejectionCount: 1 }
      },
      { new: true }
    );

    if (!task) {
      const existing = await Task.findOne({ id: taskId });
      if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });
      if (existing.postedBy !== userId) {
        return res.status(403).json({ success: false, message: 'Only the poster can reject this task' });
      }
      return res.status(400).json({ success: false, message: 'Task must be under-review to reject' });
    }

    res.status(200).json({
      success: true,
      message: 'Task proof rejected. Reverted to claimed status.',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchTasks = async (req, res) => {
  try {
    const { search, minBounty, maxBounty, deadline, status, sort, type, userId } = req.query;

    let filter = {};

    // ReDoS & NoSQL Injection Protection - Item 14:
    // Safely escape regex metacharacters
    if (search && typeof search === 'string' && search.trim()) {
      const safeQuery = escapeRegex(search.trim().substring(0, 50));
      filter.$or = [
        { title: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } }
      ];
    }

    if (minBounty && !isNaN(Number(minBounty))) {
      const min = Math.max(0, parseInt(minBounty));
      filter.bounty = { ...filter.bounty, $gte: min };
    }
    if (maxBounty && !isNaN(Number(maxBounty))) {
      const max = Math.max(0, parseInt(maxBounty));
      filter.bounty = { ...filter.bounty, $lte: max };
    }

    if (deadline && !isNaN(Number(deadline))) {
      const d = Math.max(1, parseInt(deadline));
      filter.deadlineHours = { ...filter.deadlineHours, $lte: d };
    }

    const ALLOWED_STATUSES = ['open', 'claimed', 'under-review', 'approved', 'rejected', 'abandoned'];
    if (status && typeof status === 'string' && status !== 'all') {
      const statuses = status
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => ALLOWED_STATUSES.includes(s));
      if (statuses.length > 0) {
        filter.status = { $in: statuses };
      }
    }

    if (type && userId && typeof userId === 'string') {
      if (type === 'posted') {
        filter.postedBy = userId;
      } else if (type === 'claimed') {
        filter.claimedBy = userId;
      }
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sort === 'highest-bounty' || sort === 'highest') {
      sortObj = { bounty: -1 };
    } else if (sort === 'lowest-bounty' || sort === 'lowest') {
      sortObj = { bounty: 1 };
    } else if (sort === 'most-time') {
      sortObj = { deadlineHours: -1 };
    } else if (sort === 'least-time') {
      sortObj = { deadlineHours: 1 };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter).sort(sortObj).skip(skip).limit(limit);
    const enrichedTasks = await enrichTasksBatch(tasks);

    res.status(200).json({
      success: true,
      count: enrichedTasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks: enrichedTasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  postTask,
  getOpenTasks,
  getTaskById,
  claimTask,
  submitProof,
  approveTask,
  checkAndResolveGhosting,
  autoResolveGhosting,
  deleteTask,
  rejectTask,
  searchTasks
};
