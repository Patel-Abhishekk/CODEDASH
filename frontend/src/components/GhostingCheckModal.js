import React from 'react';

export default function GhostingCheckModal({ isOpen, onClose, resolvedCount, resolvedTasks = [] }) {
  if (!isOpen) return null;

  return (
    <div className="ghosting-modal-overlay" onClick={onClose}>
      <div className="ghosting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ghosting-modal-header">
          <h2>⏰ Abandoned Tasks Resolution</h2>
          <button className="ghosting-modal-close-icon" onClick={onClose}>×</button>
        </div>

        <div className="ghosting-modal-body">
          <p className="ghosting-modal-message">
            {resolvedCount > 0
              ? `${resolvedCount} task(s) have been automatically resolved due to 48+ hours of no response`
              : 'No abandoned tasks found'}
          </p>

          {resolvedCount > 0 && resolvedTasks && resolvedTasks.length > 0 && (
            <div className="ghosting-table-container">
              <table className="ghosting-table">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Original Bounty</th>
                    <th>Your Refund</th>
                    <th>Solver Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedTasks.map((task, index) => (
                    <tr key={task.id || index}>
                      <td className="task-title-cell">{task.title}</td>
                      <td>₹{task.bounty}</td>
                      <td>₹{task.refund || task.bounty / 2}</td>
                      <td>₹{task.solverPayment || task.bounty / 2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resolvedCount > 0 && (
            <div className="ghosting-info-box">
              <p>💡 Funds have been automatically transferred (50% refund to poster, 50% payment to solver).</p>
            </div>
          )}
        </div>

        <div className="ghosting-modal-footer">
          <button className="btn-ghosting-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
