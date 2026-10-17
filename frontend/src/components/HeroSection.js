import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Post tasks. Solve bugs.<br/><span className="text-accent">Get paid.</span></h1>
        <p className="hero-subtitle">
          CodeDash is a peer-to-peer marketplace where clients post coding tasks with fixed bounties, and developers claim and solve them for direct payouts.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">Create Account</Link>
          <Link to="/login" className="btn-outline">Sign In</Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="code-mockup">
          <div className="code-header">
            <span className="code-dot"></span>
            <span className="code-dot"></span>
            <span className="code-dot"></span>
          </div>
          <div className="code-body">
            <div className="code-line"><span className="code-keyword">const</span> task = {'{'}</div>
            <div className="code-line indent"><span className="code-prop">title</span>: <span className="code-string">"Fix auth bug"</span>,</div>
            <div className="code-line indent"><span className="code-prop">bounty</span>: <span className="code-number">500</span>,</div>
            <div className="code-line indent"><span className="code-prop">status</span>: <span className="code-string">"open"</span></div>
            <div className="code-line">{'}'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
