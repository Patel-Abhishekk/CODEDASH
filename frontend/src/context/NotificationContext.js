import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { notificationAPI } from '../utils/api';

export const NotificationContext = createContext();

const SOCKET_SERVER_URL = 'http://localhost:5000';

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Show a toast message popup
  const showToast = useCallback((toastData) => {
    // Can pass string message or full object { message, type, title, actionLabel, actionUrl, duration }
    const toastObj = typeof toastData === 'string'
      ? { message: toastData, type: 'info' }
      : toastData;

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    const newToast = {
      id,
      type: toastObj.type || 'info',
      title: toastObj.title || '',
      message: toastObj.message || '',
      actionLabel: toastObj.actionLabel || '',
      actionUrl: toastObj.actionUrl || '',
      duration: toastObj.duration !== undefined ? toastObj.duration : 5000,
      ...toastObj,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await notificationAPI.getNotifications(user.id);
      const fetched = res.data?.notifications || [];
      setNotifications(fetched);
      setUnreadCount(fetched.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add notification locally and trigger a toast
  const addNotification = useCallback((newNotif, triggerToast = true) => {
    setNotifications((prev) => {
      // Prevent duplicates
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });

    if (!newNotif.read) {
      setUnreadCount((prev) => prev + 1);
    }

    if (triggerToast) {
      let toastType = 'info';
      if (newNotif.type === 'task_approved') toastType = 'success';
      else if (newNotif.type === 'task_rejected') toastType = 'error';
      else if (newNotif.type === 'task_abandoned') toastType = 'warning';
      else if (newNotif.type === 'task_claimed') toastType = 'info';

      showToast({
        type: toastType,
        title: newNotif.title || 'New Notification',
        message: newNotif.message,
        actionUrl: newNotif.actionUrl,
        actionLabel: newNotif.type === 'new_message' ? 'Open Chat' : 'View Task',
      });
    }
  }, [showToast]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationAPI.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  // Delete notification
  const removeNotification = useCallback(async (id) => {
    try {
      const target = notifications.find((n) => n.id === id);
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationAPI.clearAll(user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [user?.id]);

  // Initialize Socket.io connection for real-time notifications
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Notification socket connected, joining user room user-' + user.id);
      socket.emit('join-user', user.id);
    });

    // Real-time notification event from backend
    socket.on('notification', (data) => {
      console.log('⚡ Real-time notification received:', data);
      addNotification(data, true);
    });

    // Real-time unread count sync
    socket.on('unread-count', ({ count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, fetchNotifications, addNotification]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    loading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    deleteNotification: removeNotification,
    clearAll,
    showToast,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
