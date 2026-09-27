import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Landing.css';

export default function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="landing-navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <h2>CodeDash</h2>
        </div>
        
        <div className="navbar-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#stats">Stats</a>
        </div>
        
        <div className="navbar-actions">
          <Link to="/login" className="btn-signin">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}
