const { readDB, writeDB } = require('../config/db');
const { createNotificationObject, NOTIFICATION_TYPES } = require('../models/Notification');

let ioInstance = null;

// Allow server.js to set Socket.io instance for real-time notification broadcasts
const setSocketIO = (io) => {
  ioInstance = io;
};

// Internal function to create and persist a notification
const createNotification = (userId, type, taskId, message, relatedUserId = null, metadata = {}, actionUrl = '') => {
  try {
    if (!userId) return null;

    const db = readDB();
    if (!db.notifications) {
      db.notifications = [];
    }

    const notification = createNotificationObject({
      userId,
      type,
      message,
      taskId,
      relatedUserId,
      actionUrl,
      metadata,
    });

    db.notifications.push(notification);

    // Keep user's notifications array in sync if user object exists (backwards compatibility)
    const userIndex = (db.users || []).findIndex(u => String(u.id) === String(userId));
    if (userIndex !== -1) {
      if (!db.users[userIndex].notifications) {
        db.users[userIndex].notifications = [];
      }
      db.users[userIndex].notifications.push(notification);
    }

    writeDB(db);

    // Emit real-time notification to user's room if socket is available
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('notification', notification);
      // Also emit a general unread-count update
      const unreadCount = db.notifications.filter(n => String(n.userId) === String(userId) && !n.read).length;
      ioInstance.to(`user-${userId}`).emit('unread-count', { count: unreadCount });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// GET /api/notifications - Get all notifications for user
const getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || req.params.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const db = readDB();
    const notifications = (db.notifications || [])
      .filter(n => String(n.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifications.filter(n => !n.read).length;

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/unread-count - Get unread count
const getUserUnreadCount = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const db = readDB();
    const count = (db.notifications || []).filter(
      n => String(n.userId) === String(userId) && !n.read
    ).length;

    res.status(200).json({
      success: true,
      count,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/:id/read - Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const notifIndex = (db.notifications || []).findIndex(n => String(n.id) === String(id));
    if (notifIndex === -1) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    db.notifications[notifIndex].read = true;
    const targetUserId = db.notifications[notifIndex].userId;

    // Sync in user object if present
    const userIndex = (db.users || []).findIndex(u => String(u.id) === String(targetUserId));
    if (userIndex !== -1 && db.users[userIndex].notifications) {
      const uNotifIndex = db.users[userIndex].notifications.findIndex(n => String(n.id) === String(id));
      if (uNotifIndex !== -1) {
        db.users[userIndex].notifications[uNotifIndex].read = true;
      }
    }

    writeDB(db);

    if (ioInstance && targetUserId) {
      const unreadCount = db.notifications.filter(n => String(n.userId) === String(targetUserId) && !n.read).length;
      ioInstance.to(`user-${targetUserId}`).emit('unread-count', { count: unreadCount });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: db.notifications[notifIndex],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/mark-all-read - Mark all notifications for a user as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const db = readDB();
    if (db.notifications) {
      db.notifications.forEach(n => {
        if (String(n.userId) === String(userId)) {
          n.read = true;
        }
      });
    }

    const userIndex = (db.users || []).findIndex(u => String(u.id) === String(userId));
    if (userIndex !== -1 && db.users[userIndex].notifications) {
      db.users[userIndex].notifications.forEach(n => {
        n.read = true;
      });
    }

    writeDB(db);

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('unread-count', { count: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/:id or POST /api/notifications/:id/delete - Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const notif = (db.notifications || []).find(n => String(n.id) === String(id));
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const targetUserId = notif.userId;
    db.notifications = (db.notifications || []).filter(n => String(n.id) !== String(id));

    // Remove from user object if present
    const userIndex = (db.users || []).findIndex(u => String(u.id) === String(targetUserId));
    if (userIndex !== -1 && db.users[userIndex].notifications) {
      db.users[userIndex].notifications = db.users[userIndex].notifications.filter(
        n => String(n.id) !== String(id)
      );
    }

    writeDB(db);

    if (ioInstance && targetUserId) {
      const unreadCount = db.notifications.filter(n => String(n.userId) === String(targetUserId) && !n.read).length;
      ioInstance.to(`user-${targetUserId}`).emit('unread-count', { count: unreadCount });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/clear-all - Delete all notifications for user
const clearAll = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const db = readDB();
    db.notifications = (db.notifications || []).filter(n => String(n.userId) !== String(userId));

    const userIndex = (db.users || []).findIndex(u => String(u.id) === String(userId));
    if (userIndex !== -1 && db.users[userIndex].notifications) {
      db.users[userIndex].notifications = [];
    }

    writeDB(db);

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('unread-count', { count: 0 });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  setSocketIO,
  createNotification,
  getNotifications,
  getUserUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};
