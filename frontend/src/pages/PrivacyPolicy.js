import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import '../styles/Landing.css';

export default function PrivacyPolicy() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <main style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Privacy Policy</h1>
        <p>This is the privacy policy for CodeDash. We take your privacy seriously.</p>
        <p>1. We collect information to provide better services.</p>
        <p>2. We do not sell your personal data.</p>
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
