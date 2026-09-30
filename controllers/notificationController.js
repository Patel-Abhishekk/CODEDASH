const Notification = require('../models/Notification');
const User = require('../models/User');

const NOTIFICATION_TYPES = ['task_claimed', 'proof_submitted', 'task_approved', 'task_rejected', 'task_abandoned', 'new_message'];

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const createNotification = async (userId, type, taskId, message, relatedUserId = null, metadata = {}, actionUrl = '') => {
  try {
    if (!userId) return null;

    const notification = new Notification({
      userId,
      type,
      message,
      taskId,
      relatedUserId
    });

    await notification.save();

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('notification', notification);
      const unreadCount = await Notification.countDocuments({ userId, read: false });
      ioInstance.to(`user-${userId}`).emit('unread-count', { count: unreadCount });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || req.params.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ userId, read: false });

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

const getUserUnreadCount = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const count = await Notification.countDocuments({ userId, read: false });

    res.status(200).json({
      success: true,
      count,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We are expecting MongoDB _id here. Since original code might use a string id, let's try findById or findOne
    let notif = null;
    if (id.length === 24) {
      notif = await Notification.findById(id);
    } else {
      // In case id is something else, not handled strictly here
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.read = true;
    await notif.save();

    if (ioInstance && notif.userId) {
      const unreadCount = await Notification.countDocuments({ userId: notif.userId, read: false });
      ioInstance.to(`user-${notif.userId}`).emit('unread-count', { count: unreadCount });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: notif,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await Notification.updateMany({ userId, read: false }, { read: true });

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

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    let notif = null;
    if (id.length === 24) {
      notif = await Notification.findByIdAndDelete(id);
    }
    
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (ioInstance && notif.userId) {
      const unreadCount = await Notification.countDocuments({ userId: notif.userId, read: false });
      ioInstance.to(`user-${notif.userId}`).emit('unread-count', { count: unreadCount });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearAll = async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await Notification.deleteMany({ userId });

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
