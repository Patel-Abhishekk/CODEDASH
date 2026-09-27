import React from 'react';

export default function FeaturesSection() {
  const features = [
    {
      icon: '📝',
      title: 'Post Tasks with Bounty',
      description: 'Set your own bounty and find solvers instantly'
    },
    {
      icon: '💬',
      title: 'Real-time Chat',
      description: 'Communicate with solvers in real-time'
    },
    {
      icon: '💰',
      title: 'Instant Payouts',
      description: 'Get paid instantly after task completion'
    },
    {
      icon: '⭐',
      title: 'Community Ratings',
      description: 'Build reputation with ratings and reviews'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="section-header">
        <h2>Why Choose CodeDash?</h2>
        <p>Everything you need to post tasks or earn money by solving them.</p>
      </div>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
