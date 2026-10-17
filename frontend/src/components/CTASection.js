import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Start posting or solving tasks today</h2>
        <p>Create a free account. Post your first task or browse what needs solving.</p>
        <div className="cta-actions">
          <Link to="/register" className="btn-primary btn-large">Create Account</Link>
          <div className="cta-secondary">
            <span>Already have an account? </span>
            <Link to="/login" className="link-text">Sign in</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
