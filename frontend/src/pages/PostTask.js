import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import '../styles/PostTask.css';

export default function PostTask() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState('');
  const [deadlineHours, setDeadlineHours] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle post task form submission
  const handlePostTask = async (e) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (!title || !description || !bounty) {
      setError('All fields are required');
      return;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    if (bounty < 100) {
      setError('Minimum bounty is ₹100');
      return;
    }

    if (bounty > 100000) {
      setError('Maximum bounty is ₹100,000');
      return;
    }

    setLoading(true);

    try {
  // Call backend API to post task
  await taskAPI.postTask(title, description, parseInt(bounty), user.id, parseInt(deadlineHours));
  
  // Update user data with new wallet and escrow values
  updateUser({
    walletBalance: user.walletBalance - parseInt(bounty),
    escrowHeld: user.escrowHeld + parseInt(bounty),
  });
  
  // Show success message
  showToast({
    type: 'success',
    title: 'Task Created',
    message: 'Task posted successfully!',
    actionLabel: 'View Feed',
  });
  
  // Redirect to dashboard
  navigate('/dashboard');
}catch (err) {
      setError(err.response?.data?.message || 'Failed to post task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-task-page">
      {/* Navbar */}
      <Navbar user={user} onLogout={logout} />

      {/* Main content */}
      <div className="post-task-container">
        <div className="post-task-card">
          <h1>Post a New Task</h1>
          <p className="subtitle">Set a bounty and let solvers work on your task</p>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Post task form */}
          <form onSubmit={handlePostTask}>
            {/* Title field */}
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fix Login Bug"
                maxLength={100}
              />
              <span className="char-count">{title.length}/100</span>
            </div>

            {/* Description field */}
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail. What needs to be done?"
                rows={6}
                maxLength={1000}
              />
              <span className="char-count">{description.length}/1000</span>
            </div>

            {/* Bounty field */}
            <div className="form-row">
              <div className="form-group">
                <label>Bounty Amount (₹) *</label>
                <input
                  type="number"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  placeholder="e.g., 500"
                  min={100}
                  max={100000}
                />
                <span className="help-text">Min: ₹100 | Max: ₹100,000</span>
              </div>

              {/* Deadline field */}
              <div className="form-group">
                <label>Deadline (Hours) *</label>
                <select
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(e.target.value)}
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="6">6 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                </select>
              </div>
            </div>

            {/* Info box */}
            <div className="info-box">
              <p>
                <strong>💡 Tip:</strong> The bounty amount will be locked in escrow until your task is approved.
              </p>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}