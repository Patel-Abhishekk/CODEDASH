import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import '../styles/SubmitProof.css';

export default function SubmitProof() {
  const { taskId } = useParams();
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [proofOfWork, setProofOfWork] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

      // Check if user is the one who claimed the task
      if (fetchedTask.claimedBy !== user?.id) {
        setError('You did not claim this task');
        return;
      }

      // Check if task is in claimed status
      if (fetchedTask.status !== 'claimed') {
        setError('This task is not available for proof submission');
        return;
      }

      setTask(fetchedTask);
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  // Handle submit proof
  const handleSubmitProof = async (e) => {
    e.preventDefault();
    setError('');

    // Validate proof
    if (!proofOfWork.trim()) {
      setError('Please enter your proof of work');
      return;
    }

    if (proofOfWork.length < 10) {
      setError('Proof must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Call backend API to submit proof
      await taskAPI.submitProof(taskId, user.id, proofOfWork);

      // Show success message
      showToast({
        type: 'info',
        title: 'Proof Submitted',
        message: 'Proof submitted! Waiting for review...',
        actionLabel: 'View Task',
        actionUrl: `/task/${taskId}`,
      });

      // Redirect to task detail
      navigate(`/task/${taskId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!task?.claimDeadline) return null;
    const deadline = new Date(task.claimDeadline);
    const now = new Date();
    const hoursLeft = Math.ceil((deadline - now) / (1000 * 60 * 60));
    return hoursLeft > 0 ? hoursLeft : 0;
  };

  if (loading) {
    return (
      <div className="submit-proof-page">
        <Navbar user={user} onLogout={logout} />
        <div className="loading-container">
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="submit-proof-page">
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

  const timeRemaining = getTimeRemaining();

  return (
    <div className="submit-proof-page">
      {/* Navbar */}
      <Navbar user={user} onLogout={logout} />

      {/* Main content */}
      <div className="submit-proof-container">
        {/* Left section - Form */}
        <div className="submit-proof-left">
          {/* Back button */}
          <button 
            className="btn-back"
            onClick={() => navigate(`/task/${taskId}`)}
          >
            ← Back to Task
          </button>

          {/* Page header */}
          <div className="submit-proof-header">
            <h1>Submit Proof of Work</h1>
            <p className="subtitle">Show your work and get paid!</p>
          </div>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Task summary */}
          <div className="task-summary">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
          </div>

          {/* Rejection Feedback Warning */}
          {task.rejectionReason && (
            <div className="info-box-warning" style={{ borderLeft: '4px solid #EF4444', backgroundColor: '#FEF2F2', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#991B1B', marginBottom: '4px' }}>
                ⚠️ Previous Rejection Reason:
              </div>
              <div style={{ fontSize: '14px', color: '#B91C1C' }}>
                "{task.rejectionReason}"
              </div>
            </div>
          )}

          {/* Proof form */}
          <form onSubmit={handleSubmitProof}>
            {/* Proof textarea */}
            <div className="form-group">
              <label>Your Proof of Work *</label>
              <textarea
                value={proofOfWork}
                onChange={(e) => setProofOfWork(e.target.value)}
                placeholder="Paste your code, GitHub link, or detailed explanation of how you solved the task..."
                rows={10}
                maxLength={5000}
              />
              <span className="char-count">{proofOfWork.length}/5000</span>
            </div>

            {/* Tips section */}
            <div className="tips-section">
              <h4>💡 Tips for Better Proof:</h4>
              <ul>
                <li>Provide a GitHub link to your code repository</li>
                <li>Include a detailed explanation of your solution</li>
                <li>Share screenshots or live demo links</li>
                <li>Mention any technologies or libraries used</li>
                <li>Explain your approach and why you chose it</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate(`/task/${taskId}`)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '📤 Submit Proof'}
              </button>
            </div>
          </form>
        </div>

        {/* Right section - Task info */}
        <aside className="submit-proof-right">
          <div className="proof-info-card">
            <h3>Task Info</h3>

            {/* Bounty */}
            <div className="info-item">
              <span className="info-label">Bounty</span>
              <span className="info-value">₹{task.bounty}</span>
            </div>

            {/* Status */}
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value">{task.status}</span>
            </div>

            {/* Time remaining */}
            {timeRemaining !== null && (
              <div className="info-item">
                <span className="info-label">Time Remaining</span>
                <span className={`info-value ${timeRemaining < 2 ? 'urgent' : ''}`}>
                  {timeRemaining}h
                </span>
              </div>
            )}

            <hr className="info-divider" />

            {/* Info box */}
            <div className="info-box">
              <p>
                <strong>📋 What happens next?</strong>
              </p>
              <ol>
                <li>Task moves to "Under Review"</li>
                <li>Task poster reviews your work</li>
                <li>Poster can approve or reject</li>
                <li>If approved, you get ₹{task.bounty}!</li>
              </ol>
            </div>

            {/* Warning box */}
            {timeRemaining && timeRemaining < 2 && (
              <div className="warning-box">
                <p>
                  <strong>⚠️ Urgent!</strong> You have less than 2 hours left to submit!
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}