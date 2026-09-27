import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>CodeDash</h1>
        <h2>Peer-to-Peer Micro-Task Platform</h2>
        <p>Connect with task posters, solve problems, earn money. Fast. Reliable. Transparent.</p>
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
