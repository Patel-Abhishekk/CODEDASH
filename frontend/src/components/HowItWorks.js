import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Post a task',
      description: 'Describe the bug or feature, set a bounty in rupees, and choose a deadline.'
    },
    {
      number: '2',
      title: 'A developer claims it',
      description: 'Developers browse open tasks and claim the ones they can solve. Your bounty is held in escrow.'
    },
    {
      number: '3',
      title: 'Work gets submitted',
      description: 'The solver completes the task and uploads proof of their work for your review.'
    },
    {
      number: '4',
      title: 'You approve and pay',
      description: 'Review the submission, approve it, and the bounty is released to the solver instantly.'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="section-header">
        <h2>Four steps, start to finish</h2>
        <p>No negotiation, no scope creep. The process is the same every time.</p>
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
