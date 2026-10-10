import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>CodeDash Task Platform</h1>
        <h2>A Direct Peer-to-Peer Micro-Task Platform</h2>
        <p>A transparent marketplace where clients post coding tasks with bounties, and developers complete them for instant payouts.</p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">Start Now</Link>
          <a href="#features" className="btn-outline">Learn More</a>
        </div>
      </div>
      <div className="hero-image-container">
        <div className="hero-placeholder">
          {/* A simple CSS placeholder for the illustration */}
          <div className="mock-window">
            <div className="mock-header">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <div className="mock-body">
              <div className="mock-task"></div>
              <div className="mock-task"></div>
              <div className="mock-task"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
