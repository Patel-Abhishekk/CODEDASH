import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import '../styles/Sidebar.css';

export default function Sidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const { unreadCount } = useContext(ChatContext);

  const handleTabClick = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Tasks</h3>

        {/* Open Tasks Tab */}
        <button
          className={`sidebar-item ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => handleTabClick('open')}
        >
          <span className="icon">🔓</span>
          <span className="label">Open Tasks</span>
        </button>

        {/* Claimed Tasks Tab */}
        <button
          className={`sidebar-item ${activeTab === 'claimed' ? 'active' : ''}`}
          onClick={() => handleTabClick('claimed')}
        >
          <span className="icon">🎯</span>
          <span className="label">My Claimed</span>
        </button>

        {/* Posted Tasks Tab */}
        <button
          className={`sidebar-item ${activeTab === 'posted' ? 'active' : ''}`}
          onClick={() => handleTabClick('posted')}
        >
          <span className="icon">📤</span>
          <span className="label">My Posted</span>
        </button>
      </div>

      {/* Divider */}
      <hr className="sidebar-divider" />

      {/* Quick links section */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">Quick Links</h3>
        
        <button 
          className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => navigate('/task-history')}
        >
          <span className="icon">📋</span>
          <span className="label">Task History</span>
        </button>

        <button 
          className={`sidebar-item ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => navigate('/messages')}
        >
          <span className="icon">💬</span>
          <span className="label">Messages</span>
          {unreadCount > 0 && (
            <span 
              style={{
                marginLeft: 'auto',
                background: '#2563EB',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button className="sidebar-item">
          <span className="icon">⭐</span>
          <span className="label">Ratings</span>
        </button>
      </div>
    </aside>
  );
}