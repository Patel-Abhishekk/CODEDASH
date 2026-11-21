const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { registerUser, loginUser, getUserById, getUserNotifications, markNotificationsRead } = require('../controllers/usercontroller');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/notifications/:userId', authMiddleware, getUserNotifications);
router.post('/notifications/read', authMiddleware, markNotificationsRead);
router.get('/:userId', authMiddleware, getUserById);

module.exports = router;