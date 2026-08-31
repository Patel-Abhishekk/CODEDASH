const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserById, getUserNotifications, markNotificationsRead } = require('../controllers/usercontroller');

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// GET /api/users/notifications/:userId - Get user notifications
router.get('/notifications/:userId', getUserNotifications);

// POST /api/users/notifications/read - Mark notifications read
router.post('/notifications/read', markNotificationsRead);

// GET /api/users/:userId - Get user profile by ID
router.get('/:userId', getUserById);

module.exports = router;