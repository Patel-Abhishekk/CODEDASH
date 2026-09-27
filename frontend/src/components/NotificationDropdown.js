import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import '../styles/Navbar.css';

export default function NotificationDropdown({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getNotifications(userId);
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening
      userAPI.markNotificationsRead(userId).catch(console.error);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (n) => {
    setIsOpen(false);
    if (n.taskId) {
      navigate(`/task/${n.taskId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-container" style={{ position: 'relative' }}>
      <button 
        className="btn-notification-bell" 
        onClick={handleToggle} 
        title="Notifications"
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          position: 'relative',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#EF4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="notification-dropdown"
          style={{
            position: 'absolute',
            right: 0,
            top: '40px',
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontWeight: 'bold', color: '#1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications</span>
            <button 
              onClick={() => fetchNotifications()} 
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>No notifications yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map((n, index) => (
                <div
                  key={n.id || index}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    backgroundColor: n.read ? '#ffffff' : '#EFF6FF',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.read ? '#ffffff' : '#EFF6FF'}
                >
                  <div style={{ fontSize: '13px', color: '#111827', fontWeight: n.read ? 'normal' : '600' }}>
                    {n.message || n.reason || 'Task update available'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
