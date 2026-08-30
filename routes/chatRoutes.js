const express = require('express');
const router = express.Router();
const { getChatHistory, getUserChats, markMessagesRead } = require('../controllers/chatController');

// Get chat history for a task
router.get('/:taskId', getChatHistory);

// Get list of active chats for a user
router.get('/user/:userId', getUserChats);

// Mark messages in a task as read
router.post('/mark-read', markMessagesRead);

module.exports = router;
