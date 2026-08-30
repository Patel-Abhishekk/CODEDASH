const { readDB, writeDB } = require('../config/db');
const { MIN_BOUNTY, MAX_BOUNTY } = require('../constants');
// Post a new task
const postTask = async (req, res) => {
  try {
    const { title, description, bounty, userId, deadlineHours } = req.body;

    // Validate input
    // Validate input
if (!title || !description || !bounty || !userId) {
  return res.status(400).json({ message: 'Missing required fields' });
}

// Validate bounty amount in INR
if (bounty < MIN_BOUNTY) {
  return res.status(400).json({ message: `Minimum bounty is ₹${MIN_BOUNTY}` });
}

if (bounty > MAX_BOUNTY) {
  return res.status(400).json({ message: `Maximum bounty is ₹${MAX_BOUNTY}` });
}

    // Set default deadline to 2 hours if not provided
    const hours = deadlineHours || 2;

    // Read database
    const db = readDB();

    // Find user
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough balance
    if (user.walletBalance < bounty) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Create new task
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      bounty,
      postedBy: userId,
      status: 'open',
      claimedBy: null,
      claimedAt: null,
      claimDeadline: null,
      deadlineHours: hours, // Store the deadline hours for reference
      proofOfWork: null,
      submittedAt: null,
      approvedAt: null,
      rating: null,
      escrowResolved: false,
      escrowResolvedAt: null,
      escrowSplitRatio: null,
      createdAt: new Date(),
    };

    // Deduct bounty from user's wallet (escrow)
    user.walletBalance -= bounty;
    user.escrowHeld += bounty;
    user.tasksPosted.push(newTask.id);

    // Add task to database
    db.tasks.push(newTask);

    // Update user in database
    const userIndex = db.users.findIndex(u => u.id === userId);
    db.users[userIndex] = user;

    // Write updated database
    writeDB(db);

    // Return success
    res.status(201).json({
      message: 'Task posted successfully',
      task: newTask,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrichTask = (task, users = []) => {
  if (!task) return task;
  const poster = users.find(u => u.id === task.postedBy);
  const solver = task.claimedBy ? users.find(u => u.id === task.claimedBy) : null;
  return {
    ...task,
    postedByUsername: poster ? poster.username : 'Unknown',
    claimedByUsername: solver ? solver.username : null,
  };
};

// Get all open tasks (feed)
const getOpenTasks = async (req, res) => {
  try {
    const db = readDB();
    const users = db.users || [];
    const enrichedTasks = (db.tasks || []).map(task => enrichTask(task, users));
    res.status(200).json({
      message: 'Tasks fetched',
      tasks: enrichedTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const db = readDB();
    const users = db.users || [];

    // Find task
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
      message: 'Task fetched',
      task: enrichTask(task, users),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Claim a task
const claimTask = async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    // Validate input
    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Read database
    const db = readDB();

    // Find task
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    console.log('Task Status:', task.status);
console.log('Task Claimed By:', task.claimedBy);
console.log('User ID:', userId);

    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Task is not available for claiming' });
    }

    // Check if user is trying to claim their own task
    if (task.postedBy === userId) {
      return res.status(400).json({ message: 'You cannot claim your own task' });
    }

    // Claim the task (atomic operation)
    const claimedAt = new Date();
    const deadlineHours = task.deadlineHours || 2; // Use task's deadline hours
    const claimDeadline = new Date(claimedAt.getTime() + deadlineHours * 60 * 60 * 1000);

    task.claimedBy = userId;
    task.claimedAt = claimedAt;
    task.claimDeadline = claimDeadline;
    task.status = 'claimed';

    // Update user's tasksClaimed
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.tasksClaimed.push(taskId);
    }

    // Find and update task in database
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    db.tasks[taskIndex] = task;

    // Update user in database
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex] = user;
    }

    // Write updated database
    writeDB(db);

    // Return success
    res.status(200).json({
      message: 'Task claimed successfully',
      task: task,
      claimedAt: task.claimedAt,
      claimDeadline: task.claimDeadline,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit proof of work
const submitProof = async (req, res) => {
  try {
    const { taskId, userId, proofOfWork } = req.body;

    // Validate input
    if (!taskId || !userId || !proofOfWork) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Read database
    const db = readDB();

    // Find task
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is claimed
    if (task.status !== 'claimed') {
      return res.status(400).json({ message: 'Task must be in claimed status' });
    }

    // Check if the user claiming the task is the one submitting proof
    if (task.claimedBy !== userId) {
      return res.status(400).json({ message: 'Only the claimer can submit proof' });
    }

    // Check if deadline has passed
    if (new Date() > task.claimDeadline) {
      task.status = 'open';
      task.claimedBy = null;
      task.claimedAt = null;
      task.claimDeadline = null;

      const taskIndex = db.tasks.findIndex(t => t.id === taskId);
      db.tasks[taskIndex] = task;
      writeDB(db);

      return res.status(400).json({ message: 'Claim deadline has passed. Task reverted to open.' });
    }

    // Submit proof
    task.proofOfWork = proofOfWork;
    task.submittedAt = new Date();
    task.status = 'under-review';

    // Find and update task in database
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    db.tasks[taskIndex] = task;

    // Write updated database
    writeDB(db);

    // Return success
    res.status(200).json({
      message: 'Proof of work submitted successfully',
      task: task,
      submittedAt: task.submittedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve task and give rating
const approveTask = async (req, res) => {
  try {
    const { taskId, userId, rating } = req.body;

    // Validate input
    if (!taskId || !userId || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate rating is 1-5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Read database
    const db = readDB();

    // Find task
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is under-review
    if (task.status !== 'under-review') {
      return res.status(400).json({ message: 'Task must be under review to approve' });
    }

    // Check if user is the poster
    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the poster can approve this task' });
    }

    // Approve task
    task.status = 'approved';
    task.approvedAt = new Date();
    task.rating = rating;
    task.escrowResolved = true;
    task.escrowResolvedAt = new Date();

    // Find solver
    const solver = db.users.find(u => u.id === task.claimedBy);
    if (!solver) {
      return res.status(404).json({ message: 'Solver not found' });
    }

    // Find poster
    const poster = db.users.find(u => u.id === task.postedBy);
    if (!poster) {
      return res.status(404).json({ message: 'Poster not found' });
    }

    // Give 100% bounty to solver
    solver.walletBalance += task.bounty;
    solver.tasksCompleted.push(taskId);
    solver.engineerScore.bugsSolved += 1;

    // Update solver's moving average rating
    const totalRatings = solver.engineerScore.totalRatings;
    const currentAvg = solver.engineerScore.averageRating;
    const newAvg = (currentAvg * totalRatings + rating) / (totalRatings + 1);
    solver.engineerScore.averageRating = parseFloat(newAvg.toFixed(2));
    solver.engineerScore.totalRatings += 1;

    // Remove bounty from poster's escrow
    poster.escrowHeld -= task.bounty;

    // Update task in database
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    db.tasks[taskIndex] = task;

    // Update solver in database
    const solverIndex = db.users.findIndex(u => u.id === task.claimedBy);
    db.users[solverIndex] = solver;

    // Update poster in database
    const posterIndex = db.users.findIndex(u => u.id === task.postedBy);
    db.users[posterIndex] = poster;

    // Write updated database
    writeDB(db);

    // Return success
    res.status(200).json({
      message: 'Task approved successfully',
      task: task,
      solverScore: solver.engineerScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check and resolve ghosting (48-hour abandonment)
const checkAndResolveGhosting = async (req, res) => {
  try {
    const db = readDB();
    const currentTime = new Date();

    // Find all tasks that are under-review
    const underReviewTasks = db.tasks.filter(t => t.status === 'under-review');

    let resolvedTasks = 0;

    underReviewTasks.forEach(task => {
      // Check if 48 hours have passed since submission
      const submittedTime = new Date(task.submittedAt);
      const hoursElapsed = (currentTime - submittedTime) / (1000 * 60 * 60);

      if (hoursElapsed > 48) {
        // 48 hours passed - apply 50/50 ghosting rule
        const halfBounty = task.bounty / 2;

        // Find solver and poster
        const solver = db.users.find(u => u.id === task.claimedBy);
        const poster = db.users.find(u => u.id === task.postedBy);

        if (solver && poster) {
          // Give 50% to solver
          solver.walletBalance += halfBounty;
          solver.tasksCompleted.push(task.id);
          solver.engineerScore.bugsSolved += 1;

          // Refund 50% to poster
          poster.walletBalance += halfBounty;
          poster.escrowHeld -= task.bounty;

          // Mark task as abandoned
          task.status = 'abandoned';
          task.escrowResolved = true;
          task.escrowResolvedAt = currentTime;
          task.escrowSplitRatio = {
            solverPercentage: 50,
            posterPercentage: 50,
          };

          // Update users in database
          const solverIndex = db.users.findIndex(u => u.id === task.claimedBy);
          const posterIndex = db.users.findIndex(u => u.id === task.postedBy);

          if (solverIndex !== -1) {
            db.users[solverIndex] = solver;
          }
          if (posterIndex !== -1) {
            db.users[posterIndex] = poster;
          }

          resolvedTasks++;
        }
      }
    });

    // Update all modified tasks in database
    const taskIndices = underReviewTasks.map(t => db.tasks.findIndex(task => task.id === t.id));
    taskIndices.forEach((index, i) => {
      if (index !== -1) {
        db.tasks[index] = underReviewTasks[i];
      }
    });

    // Write updated database
    writeDB(db);

    // Return results
    res.status(200).json({
      message: `Ghosting check complete. ${resolvedTasks} task(s) auto-resolved with 50/50 split.`,
      resolvedTasks: resolvedTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto-resolve ghosting (48-hour abandonment)
const autoResolveGhosting = async (req, res) => {
  try {
    const db = readDB();
    const currentTime = new Date();
    let resolvedCount = 0;

    // Find all tasks that are under-review
    const underReviewTasks = db.tasks.filter(t => t.status === 'under-review');

    const resolvedTasksList = [];

    underReviewTasks.forEach(task => {
      // Check if 48 hours have passed since submission
      const submittedTime = new Date(task.submittedAt);
      const hoursElapsed = (currentTime - submittedTime) / (1000 * 60 * 60);

      if (hoursElapsed >= 48) {
        // 48 hours passed - apply 50/50 ghosting rule
        const halfBounty = task.bounty / 2;

        // Find solver and poster
        const solver = db.users.find(u => u.id === task.claimedBy);
        const poster = db.users.find(u => u.id === task.postedBy);

        if (solver && poster) {
          // Give 50% to solver
          solver.walletBalance += halfBounty;
          solver.tasksCompleted.push(task.id);
          solver.engineerScore.bugsSolved += 1;

          // Refund 50% to poster
          poster.walletBalance += halfBounty;
          poster.escrowHeld -= task.bounty;

          // Mark task as abandoned
          task.status = 'abandoned';
          task.escrowResolved = true;
          task.escrowResolvedAt = currentTime;
          task.escrowSplitRatio = {
            solverPercentage: 50,
            posterPercentage: 50,
          };

          // Update users in database
          const solverIndex = db.users.findIndex(u => u.id === task.claimedBy);
          const posterIndex = db.users.findIndex(u => u.id === task.postedBy);

          if (solverIndex !== -1) {
            db.users[solverIndex] = solver;
          }
          if (posterIndex !== -1) {
            db.users[posterIndex] = poster;
          }

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
    });

    // Update all modified tasks in database
    underReviewTasks.forEach(task => {
      const taskIndex = db.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        db.tasks[taskIndex] = task;
      }
    });

    // Write updated database
    writeDB(db);

    console.log(`Auto-resolved ${resolvedCount} abandoned tasks`);

    // Return results
    res.status(200).json({
      message: `Checked ghosting. ${resolvedCount} task(s) auto-resolved with 50/50 split.`,
      resolvedCount: resolvedCount,
      resolvedTasks: resolvedTasksList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task (only open tasks by poster)
const deleteTask = async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    // Validate request body
    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Read database
    const db = readDB();

    // Find task by taskId
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(400).json({ message: 'Task not found' });
    }

    // Validate poster
    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the task poster can delete this task' });
    }

    // Validate status is open ONLY
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Only open tasks can be deleted' });
    }

    // Find user
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Refund bounty to user's wallet & subtract from escrow
    user.walletBalance += task.bounty;
    user.escrowHeld -= task.bounty;

    // Remove task from tasksPosted array
    user.tasksPosted = (user.tasksPosted || []).filter(id => id !== taskId);

    // Update user in database
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      db.users[userIndex] = user;
    }

    // Delete task from database
    db.tasks = db.tasks.filter(t => t.id !== taskId);

    // Write updated database
    writeDB(db);

    // Return success response
    res.status(200).json({
      message: 'Task deleted successfully',
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject task proof of work and request revision
const rejectTask = async (req, res) => {
  try {
    const { taskId, userId, rejectionReason } = req.body;

    // Validate request body
    if (!taskId || !userId || !rejectionReason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate rejection reason length
    if (typeof rejectionReason !== 'string' || rejectionReason.trim().length < 10) {
      return res.status(400).json({ message: 'Rejection reason must be at least 10 characters' });
    }

    // Read database
    const db = readDB();

    // Find task by taskId
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(400).json({ message: 'Task not found' });
    }

    // Validate only poster can reject
    if (task.postedBy !== userId) {
      return res.status(400).json({ message: 'Only the poster can reject this task' });
    }

    // Validate task status is under-review ONLY
    if (task.status !== 'under-review') {
      return res.status(400).json({ message: 'Task must be under-review to reject' });
    }

    // Reject task logic: change status back to claimed, clear proof & submittedAt, set rejection fields
    task.status = 'claimed';
    task.proofOfWork = null;
    task.submittedAt = null;
    task.rejectionReason = rejectionReason.trim();
    task.rejectedAt = new Date();
    task.rejectionCount = (task.rejectionCount || 0) + 1;

    // Find solver user and add notification
    const solver = db.users.find(u => u.id === task.claimedBy);
    if (solver) {
      if (!solver.notifications) {
        solver.notifications = [];
      }
      solver.notifications.push({
        type: 'task_rejected',
        taskId: task.id,
        reason: rejectionReason.trim(),
        createdAt: new Date(),
      });
      const solverIndex = db.users.findIndex(u => u.id === task.claimedBy);
      if (solverIndex !== -1) {
        db.users[solverIndex] = solver;
      }
    }

    // Update task in database
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      db.tasks[taskIndex] = task;
    }

    // Write updated database
    writeDB(db);

    // Return success
    res.status(200).json({
      message: 'Task rejected and requested revision successfully',
      task: task,
      rejectionReason: task.rejectionReason,
      rejectedAt: task.rejectedAt,
      rejectionCount: task.rejectionCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { postTask, getOpenTasks, getTaskById, claimTask, submitProof, approveTask, checkAndResolveGhosting, autoResolveGhosting, deleteTask, rejectTask };