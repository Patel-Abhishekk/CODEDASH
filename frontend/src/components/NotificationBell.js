import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import '../styles/Notifications.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    fetchNotifications,
  } = useNotifications();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else if (notif.taskId) {
      navigate(`/task/${notif.taskId}`);
    } else if (notif.type === 'new_message') {
      navigate('/messages');
    }
  };

  const handleActionClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.type === 'new_message') {
      navigate('/messages');
    } else if (notif.type === 'task_rejected') {
      navigate(`/submit-proof/${notif.taskId}`);
    } else if (notif.type === 'proof_submitted') {
      navigate(`/approve-task/${notif.taskId}`);
    } else if (notif.taskId) {
      navigate(`/task/${notif.taskId}`);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={toggleDropdown}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>
              Notifications
              {unreadCount > 0 && (
                <span className="header-badge">{unreadCount} new</span>
              )}
            </h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  className="btn-mark-all-read"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  Mark All Read
                </button>
              )}
              <button
                className="btn-mark-all-read"
                onClick={fetchNotifications}
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">🔕</span>
                <p>No notifications yet</p>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  You'll be notified here when tasks change or messages arrive
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onItemClick={handleNotificationClick}
                  onActionClick={handleActionClick}
                  onDismiss={removeNotification}
                />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button className="btn-clear-all" onClick={clearAll}>
                Clear All
              </button>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                {notifications.length} total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
