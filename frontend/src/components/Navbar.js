import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

export default function Navbar({ user, onLogout }) {
  const handleLogout = () => {
    onLogout();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      {/* Logo on the left */}
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-logo">
          <span className="text-gradient">Code</span>Dash
        </Link>
      </div>

      {/* User info on the right */}
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user?.id && <NotificationBell />}

        {user?.id ? (
          <Link to={`/profile/${user.id}`} className="user-profile-nav-link">
            <span className="user-name">
              <strong>{user?.username}</strong>
            </span>
          </Link>
        ) : (
          <span className="user-name">
            {user?.username || 'User'}
          </span>
        )}
        
        <button 
          className="btn-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}