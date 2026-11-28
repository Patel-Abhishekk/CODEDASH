import React from 'react';

export default function StatsSection() {
  const stats = [
    { value: '1,000+', label: 'Active Users', icon: '👥' },
    { value: '₹50L+', label: 'Bounties Paid', icon: '💰' },
    { value: '95%', label: 'Satisfaction', icon: '⭐' },
    { value: '500+', label: 'Tasks Posted', icon: '🚀' }
  ];

  return (
    <section id="stats" className="stats-section">
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <span className="stat-icon">{stat.icon}</span>
            <h3 className="text-gradient">{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
