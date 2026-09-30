const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUsername, validateEmail, validatePassword } = require('../utils/validation');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'Invalid username format' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password not strong enough' });
    }

    // Check if email exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if username exists
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      id: Date.now().toString(),
      username,
      email,
      passwordHash,
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
    console.log(`✅ User registered: ${email}`);

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
        tasksCompleted: newUser.tasksCompleted
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email or password incorrect' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Email or password incorrect' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );
    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User fetched successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        escrowHeld: user.escrowHeld,
        engineerScore: user.engineerScore,
        tasksPosted: user.tasksPosted,
        tasksClaimed: user.tasksClaimed,
        tasksCompleted: user.tasksCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Notifications fetched successfully',
      notifications: notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, read: false }, { read: true });
    
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Also exported register and login so routes that expect them will work, if renamed.
// The original used registerUser and loginUser, the task requested register and login, I will export both mapping to be safe
module.exports = { registerUser, loginUser, getUserById, getUserNotifications, markNotificationsRead, register: registerUser, login: loginUser };