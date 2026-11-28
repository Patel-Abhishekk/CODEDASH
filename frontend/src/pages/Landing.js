import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import StatsSection from '../components/StatsSection';
import CTASection from '../components/CTASection';
import '../styles/Landing.css';

export default function Landing() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <h3><span className="text-gradient">Code</span>Dash</h3>
            <p>A peer-to-peer coding task marketplace.</p>
          </div>
          <div className="footer-center">
            <div className="footer-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="mailto:support@codedash.dev">Contact</a>
            </div>
          </div>
          <div className="footer-right">
            <div className="footer-copyright">
              &copy; 2026 CodeDash. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
