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
        <FeaturesSection />
        <HowItWorks />
        <StatsSection />
        <CTASection />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
          <div className="footer-copyright">
            © 2026 CodeDash. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
