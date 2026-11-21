const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getChatHistory, getUserChats, markMessagesRead } = require('../controllers/chatController');

// All chat routes are protected
router.get('/:taskId', authMiddleware, getChatHistory);
router.get('/user/:userId', authMiddleware, getUserChats);
router.post('/mark-read', authMiddleware, markMessagesRead);

module.exports = router;
