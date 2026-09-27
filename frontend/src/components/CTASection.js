import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to start earning?</h2>
        <p>Join CodeDash and connect with opportunities</p>
        <div className="cta-actions">
          <Link to="/register" className="btn-primary btn-large">Sign Up Now</Link>
          <div className="cta-secondary">
            <span>Already have an account? </span>
            <Link to="/login" className="link-text">Sign In</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
