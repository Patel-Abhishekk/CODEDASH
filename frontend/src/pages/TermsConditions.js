import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import '../styles/Landing.css';

export default function TermsConditions() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <main style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Terms and Conditions</h1>
        <p>These are the terms and conditions for using CodeDash.</p>
        <p>1. You must be at least 18 years old.</p>
        <p>2. You agree to use the platform responsibly.</p>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          <div className="footer-copyright">
            © 2026 CodeDash. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
