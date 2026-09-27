import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Post',
      description: 'Create task with details and bounty'
    },
    {
      number: '2',
      title: 'Claim',
      description: 'Others claim and get assigned'
    },
    {
      number: '3',
      title: 'Solve',
      description: 'Work and submit proof'
    },
    {
      number: '4',
      title: 'Earn',
      description: 'Get approved and paid instantly'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="section-header">
        <h2>How It Works</h2>
        <p>Four simple steps to get things done</p>
      </div>
      
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-number">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
    </section>
  );
}
