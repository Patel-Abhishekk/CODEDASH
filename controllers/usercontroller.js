const { readDB, writeDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DEFAULT_WALLET_BALANCE } = require('../constants');
const { validateUsername, validateEmail, validatePassword } = require('../utils/validation');
const { AppError, handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!validateUsername(username)) {
      throw new AppError('Invalid username format', 400);
    }
    
    if (!validateEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }
    
    if (!validatePassword(password)) {
      throw new AppError('Password not strong enough', 400);
    }

    const db = readDB();

    const emailExists = db.users.find(u => u.email === email);
    if (emailExists) {
      throw new AppError('Email already registered', 400);
    }

    const usernameExists = db.users.find(u => u.username === username);
    if (usernameExists) {
      throw new AppError('Username already taken', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

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

    db.users.push(newUser);
    writeDB(db);
    
    logger.info('User registered', { userId: newUser.id, username });

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
    logger.error('Registration failed', { error: error.message });
    handleError(error, res);
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });

    const db = readDB();

    // With manual index this could be faster, but leaving linear search if not indexed yet
    let user;
    if (db.usersByEmail) {
      const userId = db.usersByEmail[email];
      user = db.users.find(u => u.id === userId);
    } else {
      user = db.users.find(u => u.email === email);
    }
    
    if (!user) {
      throw new AppError('User not found', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 400);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    logger.info('Login successful', { userId: user.id });

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
    logger.error('Login failed', { email: req.body.email, error: error.message });
    handleError(error, res);
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
