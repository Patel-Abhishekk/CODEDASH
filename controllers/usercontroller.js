const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validateUsername, validateEmail, validatePassword } = require('../utils/validation');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate types to prevent NoSQL injection / object injection
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input types' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validate format
    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!validateUsername(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Invalid username format' });
    }
    
    if (!validateEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password not strong enough' });
    }

    // Check if email exists
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if username exists
    user = await User.findOne({ username: cleanUsername });
    if (user) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with explicit whitelist - Item 8 (Admin at signup mass assignment protection)
    // Any injected 'role', 'walletBalance', 'engineerScore', or 'id' in req.body is completely ignored.
    const newUser = new User({
      id: uuidv4(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: 'user', // Always standard user at signup
      walletBalance: 1000,
      escrowHeld: 0,
      engineerScore: {
        averageRating: 0,
        totalRatings: 0,
        bugsSolved: 0
      },
      tasksPosted: [],
      tasksClaimed: [],
      tasksCompleted: []
    });

    await newUser.save();
    console.log(`✅ User registered: ${cleanEmail}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        walletBalance: newUser.walletBalance,
        escrowHeld: newUser.escrowHeld,
        engineerScore: newUser.engineerScore,
        tasksPosted: newUser.tasksPosted,
        tasksClaimed: newUser.tasksClaimed,
        tasksCompleted: newUser.tasksCompleted
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Strict string checks to prevent NoSQL injection via operator objects - Item 14
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Find user by sanitized string email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email or password incorrect' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Email or password incorrect' });
    }

    // Generate token with role claim
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );
    console.log(`✅ User logged in: ${cleanEmail}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        walletBalance: user.walletBalance,
        escrowHeld: user.escrowHeld,
        engineerScore: user.engineerScore,
        tasksPosted: user.tasksPosted,
        tasksClaimed: user.tasksClaimed,
        tasksCompleted: user.tasksCompleted
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // IDOR Protection - Item 2:
    // If the requester is viewing another user's profile and is not an admin,
    // do NOT leak private financial data (walletBalance, escrowHeld) or private email.
    const isOwner = req.user && req.user.id === user.id;
    const isAdmin = req.user && req.user.role === 'admin';

    const userData = {
      id: user.id,
      username: user.username,
      engineerScore: user.engineerScore,
      tasksPosted: user.tasksPosted,
      tasksClaimed: user.tasksClaimed,
      tasksCompleted: user.tasksCompleted,
      createdAt: user.createdAt
    };

    if (isOwner || isAdmin) {
      userData.email = user.email;
      userData.role = user.role || 'user';
      userData.walletBalance = user.walletBalance;
      userData.escrowHeld = user.escrowHeld;
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      user: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // IDOR Protection - Item 2: User can only access their own notifications unless admin
    if (req.user && req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot view another user’s notifications.' });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      notifications: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    // IDOR Protection - Item 2: Always use authenticated user id
    const userId = req.user.id;
    await Notification.updateMany({ userId, read: false }, { read: true });
    
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  getUserNotifications,
  markNotificationsRead,
  register: registerUser,
  login: loginUser
};
