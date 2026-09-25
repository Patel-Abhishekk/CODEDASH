const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUserUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');

// GET /api/notifications - Get all notifications for user
router.get('/', getNotifications);
router.get('/user/:userId', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUserUnreadCount);

// POST /api/notifications/:id/read - Mark single notification as read
router.post('/:id/read', markAsRead);

// POST /api/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', deleteNotification);
router.post('/:id/delete', deleteNotification);

// DELETE /api/notifications/clear-all - Clear all notifications for user
router.delete('/clear-all', clearAll);
router.post('/clear-all', clearAll);

module.exports = router;
