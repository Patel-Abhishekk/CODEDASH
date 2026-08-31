const { readDB, writeDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DEFAULT_WALLET_BALANCE } = require('../constants');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Read current database
    const db = readDB();

    // Check if user already exists
    const userExists = db.users.find(u => u.email === email || u.username === username);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user object
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      passwordHash,
      walletBalance: DEFAULT_WALLET_BALANCE,
      escrowHeld: 0,
      engineerScore: {
        averageRating: 0,
        totalRatings: 0,
        bugsSolved: 0,
      },
      tasksPosted: [],
      tasksClaimed: [],
      tasksCompleted: [],
      createdAt: new Date(),
    };

    // Add user to database
    db.users.push(newUser);

    // Write updated database
    writeDB(db);

    // Return success with ALL user fields
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        walletBalance: newUser.walletBalance,
        escrowHeld: newUser.escrowHeld,
        engineerScore: newUser.engineerScore,
        tasksPosted: newUser.tasksPosted,
        tasksClaimed: newUser.tasksClaimed,
        tasksCompleted: newUser.tasksCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Read database
    const db = readDB();

    // Find user by email
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and user info with ALL fields
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        escrowHeld: user.escrowHeld,
        engineerScore: user.engineerScore,
        tasksPosted: user.tasksPosted,
        tasksClaimed: user.tasksClaimed,
        tasksCompleted: user.tasksCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'User fetched successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user notifications by ID
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = user.notifications || [];
    res.status(200).json({
      message: 'Notifications fetched successfully',
      notifications: [...notifications].reverse(), // newest first
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notifications as read
const markNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    const db = readDB();

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = db.users[userIndex];
    if (user.notifications) {
      user.notifications.forEach(n => {
        n.read = true;
      });
    }

    db.users[userIndex] = user;
    writeDB(db);

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserById, getUserNotifications, markNotificationsRead };
