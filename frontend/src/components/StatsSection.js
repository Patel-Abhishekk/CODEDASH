import React from 'react';

export default function StatsSection() {
  const stats = [
    { value: '1000+', label: 'Active Users' },
    { value: '₹50L+', label: 'Tasks Completed' },
    { value: '95%', label: 'Satisfaction Rating' },
    { value: '500+', label: 'Tasks Posted' }
  ];

  return (
    <section id="stats" className="stats-section">
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
