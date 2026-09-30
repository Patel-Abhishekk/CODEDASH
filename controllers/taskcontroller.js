const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const postTask = async (req, res) => {
  try {
    const { title, description, bounty, userId, deadlineHours } = req.body;

    if (!title || !description || !bounty || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (bounty < 100 || bounty > 100000) {
      return res.status(400).json({ message: 'Bounty must be ₹100-₹100,000' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.walletBalance < bounty) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const newTask = new Task({
      id: Date.now().toString(),
      title,
      description,
      bounty,
      postedBy: userId,
      deadlineHours: deadlineHours || 2,
      status: 'open'
    });

    await newTask.save();

    user.walletBalance -= bounty;
    user.escrowHeld += bounty;
    user.tasksPosted.push(newTask.id);
    await user.save();

    console.log(`✅ Task posted: ${title} by ${userId}`);
    res.status(201).json({ message: 'Task posted successfully', task: newTask });
  } catch (error) {
    console.error('Post task error:', error);
    res.status(500).json({ message: error.message });
  }
};

const enrichTask = async (task) => {
  if (!task) return task;
  const taskObj = typeof task.toObject === 'function' ? task.toObject() : task;
  
  const poster = await User.findOne({ id: task.postedBy });
  const solver = task.claimedBy ? await User.findOne({ id: task.claimedBy }) : null;
  
  return {
    ...taskObj,
    postedByUsername: poster ? poster.username : 'Unknown',
    claimedByUsername: solver ? solver.username : null,
  };
};

const getOpenTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ status: 'open' }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Task.countDocuments({ status: 'open' });
    
    const enrichedTasksPromises = tasks.map(t => enrichTask(t));
    const enrichedTasks = await Promise.all(enrichedTasksPromises);

    console.log(`✅ Retrieved ${tasks.length} open tasks`);
    res.json({ 
      message: 'Open tasks fetched', 
      tasks: enrichedTasks,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ id: taskId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const enrichedTask = await enrichTask(task);
    res.json({ message: 'Task fetched', task: enrichedTask });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: error.message });
  }
};

const claimTask = async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Task already claimed' });
    }

    if (task.postedBy === userId) {
      return res.status(400).json({ message: 'You cannot claim your own task' });
    }

    task.status = 'claimed';
    task.claimedBy = userId;
    task.claimedAt = new Date();
    task.claimDeadline = new Date(Date.now() + (task.deadlineHours || 2) * 60 * 60 * 1000);
    await task.save();

    const user = await User.findOne({ id: userId });
    user.tasksClaimed.push(taskId);
    await user.save();

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
      message: 'Task claimed successfully', 
      task,
      claimedAt: task.claimedAt,
      claimDeadline: task.claimDeadline
    });
  } catch (error) {
    console.error('Claim task error:', error);
    res.status(500).json({ message: error.message });
  }
};

const submitProof = async (req, res) => {
  try {
    const { taskId, userId, proofOfWork } = req.body;

    if (!taskId || !userId || !proofOfWork) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'claimed') {
      return res.status(400).json({ message: 'Task must be in claimed status' });
    }

    if (task.claimedBy !== userId) {
      return res.status(400).json({ message: 'Only the claimer can submit proof' });
    }

    if (new Date() > task.claimDeadline) {
      task.status = 'open';
      task.claimedBy = null;
      task.claimedAt = null;
      task.claimDeadline = null;
      await task.save();
      return res.status(400).json({ message: 'Claim deadline has passed. Task reverted to open.' });
    }

    task.proofOfWork = proofOfWork;
    task.submittedAt = new Date();
    task.status = 'under-review';
    await task.save();

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
      message: 'Proof of work submitted successfully',
      task,
      submittedAt: task.submittedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveTask = async (req, res) => {
  try {
    const { taskId, userId, rating } = req.body;

    if (!taskId || !userId || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'under-review') {
      return res.status(400).json({ message: 'Task must be under review to approve' });
    }

    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the poster can approve this task' });
    }

    task.status = 'approved';
    task.approvedAt = new Date();
    task.rating = rating;
    task.escrowResolved = true;
    task.escrowResolvedAt = new Date();
    await task.save();

    const solver = await User.findOne({ id: task.claimedBy });
    if (!solver) return res.status(404).json({ message: 'Solver not found' });

    const poster = await User.findOne({ id: task.postedBy });
    if (!poster) return res.status(404).json({ message: 'Poster not found' });

    solver.walletBalance += task.bounty;
    solver.tasksCompleted.push(taskId);
    solver.engineerScore.bugsSolved += 1;

    const totalRatings = solver.engineerScore.totalRatings || 0;
    const currentAvg = solver.engineerScore.averageRating || 0;
    const newAvg = (currentAvg * totalRatings + rating) / (totalRatings + 1);
    solver.engineerScore.averageRating = parseFloat(newAvg.toFixed(2));
    solver.engineerScore.totalRatings = totalRatings + 1;
    await solver.save();

    poster.escrowHeld -= task.bounty;
    await poster.save();

    await createNotification(
      task.claimedBy,
      'task_approved',
      task.id,
      `${poster.username} approved your work on: ${task.title}`,
      poster.id,
      {
        taskTitle: task.title,
        posterUsername: poster.username,
        rating: rating,
        earned: task.bounty,
      },
      `/task/${task.id}`
    );

    res.status(200).json({
      message: 'Task approved successfully',
      task,
      solverScore: solver.engineerScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      const halfBounty = task.bounty / 2;

      const solver = await User.findOne({ id: task.claimedBy });
      const poster = await User.findOne({ id: task.postedBy });

      if (solver && poster) {
        solver.walletBalance += halfBounty;
        solver.tasksCompleted.push(task.id);
        solver.engineerScore.bugsSolved += 1;
        await solver.save();

        poster.walletBalance += halfBounty;
        poster.escrowHeld -= task.bounty;
        await poster.save();

        task.status = 'abandoned';
        task.escrowResolved = true;
        task.escrowResolvedAt = currentTime;
        task.escrowSplitRatio = {
          solverPercentage: 50,
          posterPercentage: 50,
        };
        await task.save();

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

const checkAndResolveGhosting = async (req, res) => {
  try {
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
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) return res.status(400).json({ message: 'Task not found' });
    
    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the task poster can delete this task' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Only open tasks can be deleted' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.walletBalance += task.bounty;
    user.escrowHeld -= task.bounty;
    user.tasksPosted = user.tasksPosted.filter(id => id !== taskId);
    await user.save();

    await Task.deleteOne({ id: taskId });

    res.status(200).json({
      message: 'Task deleted successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectTask = async (req, res) => {
  try {
    const { taskId, userId, rejectionReason } = req.body;

    if (!taskId || !userId || !rejectionReason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (typeof rejectionReason !== 'string' || rejectionReason.trim().length < 10) {
      return res.status(400).json({ message: 'Rejection reason must be at least 10 characters' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) return res.status(400).json({ message: 'Task not found' });
    
    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the poster can reject this task' });
    }

    if (task.status !== 'under-review') {
      return res.status(400).json({ message: 'Task must be under-review to reject' });
    }

    task.status = 'claimed';
    task.proofOfWork = null;
    task.submittedAt = null;
    task.rejectionReason = rejectionReason.trim();
    task.rejectedAt = new Date();
    task.rejectionCount = (task.rejectionCount || 0) + 1;
    
    await task.save();

    res.status(200).json({
      message: 'Task proof rejected. Reverted to claimed status.',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchTasks = async (req, res) => {
  try {
    const { search, minBounty, maxBounty, deadline, status, sort, type, userId } = req.query;

    let filter = {};

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (minBounty && !isNaN(Number(minBounty))) {
      filter.bounty = { ...filter.bounty, $gte: Number(minBounty) };
    }
    if (maxBounty && !isNaN(Number(maxBounty))) {
      filter.bounty = { ...filter.bounty, $lte: Number(maxBounty) };
    }

    if (deadline && !isNaN(Number(deadline))) {
      filter.deadlineHours = { ...filter.deadlineHours, $lte: Number(deadline) };
    }

    if (status && status !== 'all') {
      const statuses = status.split(',').map(s => s.trim().toLowerCase());
      filter.status = { $in: statuses };
    }

    if (type && userId) {
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

    const tasks = await Task.find(filter).sort(sortObj);
    const enrichedTasksPromises = tasks.map(t => enrichTask(t));
    const enrichedTasks = await Promise.all(enrichedTasksPromises);

    res.status(200).json({
      success: true,
      count: enrichedTasks.length,
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