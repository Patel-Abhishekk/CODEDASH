import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-badge">
        <span className="badge-dot"></span>
        <span>Peer-to-Peer Task Marketplace</span>
      </div>
      <div className="hero-content">
        <h1>Post tasks. Solve bugs.<br/><span className="text-gradient">Get paid.</span></h1>
        <p className="hero-subtitle">
          CodeDash is a peer-to-peer marketplace where clients post coding tasks with fixed bounties, and developers claim and solve them for direct payouts.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary btn-large btn-glow">Create Account <span className="btn-arrow">→</span></Link>
          <Link to="/login" className="btn-outline btn-large">Sign In</Link>
        </div>
        <div className="hero-trust">
          <div className="trust-avatars">
            <span className="trust-avatar" style={{background: '#6C5CE7'}}>D</span>
            <span className="trust-avatar" style={{background: '#00D2FF'}}>A</span>
            <span className="trust-avatar" style={{background: '#FF6B6B'}}>K</span>
            <span className="trust-avatar" style={{background: '#FECA57'}}>R</span>
          </div>
          <span className="trust-text">Trusted by 1,000+ developers</span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="code-mockup">
          <div className="code-header">
            <div className="code-dots">
              <span className="code-dot red"></span>
              <span className="code-dot yellow"></span>
              <span className="code-dot green"></span>
            </div>
            <span className="code-filename">task.js</span>
          </div>
          <div className="code-body">
            <div className="code-line"><span className="code-line-num">1</span><span className="code-keyword">const</span> task = {'{'}</div>
            <div className="code-line indent"><span className="code-line-num">2</span><span className="code-prop">title</span>: <span className="code-string">"Fix auth bug"</span>,</div>
            <div className="code-line indent"><span className="code-line-num">3</span><span className="code-prop">bounty</span>: <span className="code-number">500</span>,</div>
            <div className="code-line indent"><span className="code-line-num">4</span><span className="code-prop">status</span>: <span className="code-string">"open"</span>,</div>
            <div className="code-line indent"><span className="code-line-num">5</span><span className="code-prop">solver</span>: <span className="code-keyword">null</span></div>
            <div className="code-line"><span className="code-line-num">6</span>{'}'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
