import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import '../styles/ApproveTask.css';

export default function ApproveTask() {
  const { taskId } = useParams();
  const { user, logout, updateUser } = useContext(AuthContext);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  // Fetch task details on page load
  useEffect(() => {
    fetchTaskDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Fetch task from backend
  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTaskById(taskId);
      const fetchedTask = response.data.task;

      // Check if user is the task poster
      if (fetchedTask.postedBy !== user?.id) {
        setError('You did not post this task');
        return;
      }

      // Check if task is under review
      if (fetchedTask.status !== 'under-review') {
        setError('This task is not ready for approval');
        return;
      }

      setTask(fetchedTask);
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve task
  const handleApprove = async () => {
    setError('');

    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setApproving(true);

    try {
      // Call backend API to approve task
      await taskAPI.approveTask(taskId, user.id, rating);

      if (user) {
        updateUser({
          escrowHeld: Math.max(0, (user.escrowHeld || 0) - task.bounty)
        });
      }

      // Show success message
      showToast({
        type: 'success',
        title: 'Task Approved',
        message: `Task approved! ₹${task.bounty} transferred to solver.`,
        actionLabel: 'Dashboard',
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve task');
    } finally {
      setApproving(false);
    }
  };

  // Handle reject task
  const handleReject = async () => {
    setError('');

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    setRejecting(true);

    try {
      await taskAPI.rejectTask(taskId, user.id, rejectionReason.trim());
      showToast({
        type: 'warning',
        title: 'Proof Rejected',
        message: 'Proof rejected. Solver notified.',
        actionLabel: 'Dashboard',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject task');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="approve-task-page">
        <Navbar user={user} onLogout={logout} />
        <div className="loading-container">
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="approve-task-page">
        <Navbar user={user} onLogout={logout} />
        <div className="error-container">
          <p>{error || 'Unable to load task'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approve-task-page">
      {/* Navbar */}
      <Navbar user={user} onLogout={logout} />

      {/* Main content */}
      <div className="approve-task-container">
        {/* Left section - Task & Proof */}
        <div className="approve-task-left">
          {/* Back button */}
          <button 
            className="btn-back"
            onClick={() => navigate(`/task/${taskId}`)}
          >
            ← Back to Task
          </button>

          {/* Page header */}
          <div className="approve-task-header">
            <h1>Review & Approve Task</h1>
            <p className="subtitle">Review the solver's work and give your rating</p>
          </div>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Task section */}
          <div className="task-review-section">
            <h3>Original Task</h3>
            <div className="task-box">
              <h4>{task.title}</h4>
              <p>{task.description}</p>
            </div>
          </div>

          {/* Proof of work section */}
          <div className="proof-review-section">
            <h3>Solver's Proof of Work</h3>
            <div className="proof-box">
              <p>{task.proofOfWork}</p>
              <p className="submitted-time">
                Submitted: {new Date(task.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Rating section */}
          <div className="rating-section">
            <h3>Your Rating</h3>
            <p className="rating-label">How would you rate this work?</p>
            
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star ${rating >= star ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>

            <p className="rating-display">{rating} out of 5 stars</p>

            {/* Rating descriptions */}
            <div className="rating-descriptions">
              {rating === 1 && <p>Poor - Doesn't meet requirements</p>}
              {rating === 2 && <p>Below Average - Needs significant improvements</p>}
              {rating === 3 && <p>Average - Meets basic requirements</p>}
              {rating === 4 && <p>Good - Well done with minor issues</p>}
              {rating === 5 && <p>Excellent - Perfect work!</p>}
            </div>
          </div>

          {/* Rejection section */}
          <div className="rejection-section">
            <div className="rejection-toggle">
              <label className="toggle-label">
                <input 
                  type="checkbox"
                  checked={showRejection}
                  onChange={(e) => {
                    setShowRejection(e.target.checked);
                    setError('');
                  }}
                />
                <span>I want to reject this proof and request revision</span>
              </label>
            </div>

            {showRejection && (
              <div className="rejection-content">
                <label className="rejection-label">
                  Reason for rejection (required)
                </label>
                <textarea
                  className="rejection-textarea"
                  placeholder="E.g., Code doesn't work, missing features, needs optimization"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <div className="char-count">
                  {rejectionReason.length}/500
                </div>

                <div className="rejection-info-box">
                  <p>Solver will be notified and task returns to 'claimed' status</p>
                </div>

                <button 
                  type="button" 
                  className="btn-reject"
                  onClick={handleReject}
                  disabled={rejecting}
                >
                  {rejecting ? 'Rejecting...' : '❌ Reject & Request Revision'}
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!showRejection && (
            <div className="approve-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate(`/task/${taskId}`)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-approve"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? 'Approving...' : '✓ Approve & Disburse Funds'}
              </button>
            </div>
          )}
        </div>

        {/* Right section - Summary */}
        <aside className="approve-task-right">
          <div className="approval-summary-card">
            <h3>Approval Summary</h3>

            {/* Bounty */}
            <div className="summary-item">
              <span className="summary-label">Bounty to Disburse</span>
              <span className="summary-value">₹{task.bounty}</span>
            </div>

            {/* Solver */}
            <div className="summary-item">
              <span className="summary-label">Paying to Solver</span>
              <span className="summary-value">{task.claimedByUsername || 'Solver'}</span>
            </div>

            {/* Rating */}
            <div className="summary-item">
              <span className="summary-label">Your Rating</span>
              <span className="summary-value">{rating} ⭐</span>
            </div>

            <hr className="summary-divider" />

            {/* Info box */}
            <div className="summary-info-box">
              <p><strong>What happens next:</strong></p>
              <ol>
                <li>₹{task.bounty} will be transferred to solver</li>
                <li>Solver's rating updates to {rating} ⭐</li>
                <li>Task moves to "Approved" status</li>
                <li>Your escrow amount is released</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="summary-warning">
              <p><strong>⚠️ Final Check</strong></p>
              <p>Make sure you're satisfied with the work before approving. This action cannot be undone.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}