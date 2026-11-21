const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getNotifications,
  getUserUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');

// All notification routes are protected
router.get('/', authMiddleware, getNotifications);
router.get('/user/:userId', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUserUnreadCount);
router.post('/:id/read', authMiddleware, markAsRead);
router.post('/mark-all-read', authMiddleware, markAllAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
router.post('/:id/delete', authMiddleware, deleteNotification);
router.delete('/clear-all', authMiddleware, clearAll);
router.post('/clear-all', authMiddleware, clearAll);

module.exports = router;
