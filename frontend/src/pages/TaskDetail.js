import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import '../styles/TaskDetail.css';

export default function TaskDetail() {
  const { taskId } = useParams();
  const { user, logout, updateUser } = useContext(AuthContext);
  const { openChat } = useContext(ChatContext);
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setTask(response.data.task);
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  // Handle claim task
  const handleClaim = async () => {
    setClaiming(true);
    setError('');

    try {
      await taskAPI.claimTask(taskId, user.id);
      alert('Task claimed successfully! You now have until the deadline to submit proof.');
      fetchTaskDetail(); // Refresh task data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim task');
    } finally {
      setClaiming(false);
    }
  };

  // Handle delete task
  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure? This will refund ₹${task.bounty} to your wallet.`);
    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      const response = await taskAPI.deleteTask(taskId, user.id);
      if (response.data?.user) {
        updateUser(response.data.user);
      }
      alert(`Task deleted! ₹${task.bounty} refunded`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate hours remaining
  const getTimeRemaining = () => {
    if (!task?.claimDeadline) return null;
    const deadline = new Date(task.claimDeadline);
    const now = new Date();
    const hoursLeft = Math.ceil((deadline - now) / (1000 * 60 * 60));
    return hoursLeft > 0 ? hoursLeft : 0;
  };

  if (loading) {
    return (
      <div className="task-detail-page">
        <Navbar user={user} onLogout={logout} />
        <div className="loading-container">
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-page">
        <Navbar user={user} onLogout={logout} />
        <div className="error-container">
          <p>Task not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  const posterName = task.postedByUsername || (task.postedBy === user?.id ? user?.username : 'User');
  const posterAvatarLetter = posterName ? posterName.charAt(0).toUpperCase() : 'U';

  const solverName = task.claimedByUsername || (task.claimedBy === user?.id ? user?.username : 'Solver');

  // Check chat eligibility: allowed on 'claimed', 'under-review', 'approved' for poster or solver
  const allowedChatStatuses = ['claimed', 'under-review', 'approved'];
  const isParticipant = user && (user.id === task.postedBy || user.id === task.claimedBy);
  const canChat = allowedChatStatuses.includes(task.status) && isParticipant;

  const isUserPoster = user?.id === task.postedBy;
  const otherChatPartnerName = isUserPoster ? solverName : posterName;

  return (
    <div className="task-detail-page">
      {/* Navbar */}
      <Navbar user={user} onLogout={logout} />

      {/* Main content */}
      <div className="task-detail-container">
        {/* Left section - Task details */}
        <div className="task-detail-left">
          {/* Back button */}
          <button 
            className="btn-back"
            onClick={() => navigate('/dashboard')}
          >
            ← Back
          </button>

          {/* Task header */}
          <div className="task-detail-header">
            <div>
              <h1>{task.title}</h1>
              {/* Posted by Section */}
              <div className="posted-by-section">
                <span>Posted by:</span>
                <div className="posted-by-avatar">{posterAvatarLetter}</div>
                <span 
                  className="posted-by-username"
                  onClick={() => navigate(`/profile/${task.postedBy}`)}
                >
                  {posterName}
                </span>
              </div>
            </div>
            <span className={`status-badge ${task.status}`}>
              {task.status}
            </span>
          </div>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Task description */}
          <div className="task-section">
            <h3>Description</h3>
            <p className="task-description-full">{task.description}</p>
          </div>

          {/* Task requirements */}
          <div className="task-section">
            <h3>Requirements</h3>
            <ul>
              <li>Complete the task before the deadline</li>
              <li>Submit proof of work (code, link, or documentation)</li>
              <li>Communicate with the task poster if needed</li>
              <li>Follow all specifications mentioned in the description</li>
            </ul>
          </div>

          {/* Claim button - Only if task is open and user is not poster */}
          {task.status === 'open' && task.postedBy !== user?.id && (
            <button 
              className="btn-claim-large"
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : '🎯 Claim This Task'}
            </button>
          )}

          {/* Delete task button - Only if task is open and user is poster */}
          {task.status === 'open' && task.postedBy === user?.id && (
            <button 
              className="btn-delete"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : '🗑️ Delete Task'}
            </button>
          )}

          {/* Submit proof button - If user has claimed and task is in claimed status */}
          {task.claimedBy === user?.id && task.status === 'claimed' && (
            <button 
              className="btn-submit-proof"
              onClick={() => navigate(`/submit-proof/${taskId}`)}
            >
              📤 Submit Proof of Work
            </button>
          )}

          {/* Rejection Feedback Warning */}
          {task.claimedBy === user?.id && task.status === 'claimed' && task.rejectionReason && (
            <div className="info-box-warning" style={{ borderLeft: '4px solid #EF4444', backgroundColor: '#FEF2F2', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', color: '#991B1B', marginBottom: '4px' }}>
                ⚠️ Revision Requested by Poster
              </div>
              <div style={{ fontSize: '14px', color: '#B91C1C' }}>
                "{task.rejectionReason}"
              </div>
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px' }}>
                Please make the necessary changes and re-submit your proof of work before the deadline.
              </div>
            </div>
          )}

          {/* Already claimed message */}
          {task.claimedBy === user?.id && task.status === 'claimed' && timeRemaining !== null && (
            <div className="info-box-warning">
              ⏱️ You have <strong>{timeRemaining} hours</strong> left to submit your proof!
            </div>
          )}

          {/* Task under review - Poster's approval button */}
          {task.status === 'under-review' && task.postedBy === user?.id && (
            <>
              <button 
                className="btn-approve-task"
                onClick={() => navigate(`/approve-task/${taskId}`)}
              >
                👁️ Review & Approve Task
              </button>
            </>
          )}

          {/* Already submitted message - Solver waiting */}
          {task.status === 'under-review' && task.claimedBy === user?.id && (
            <div className="info-box-success">
              ✓ You've submitted proof for this task. Waiting for approval...
            </div>
          )}

          {/* Approved message */}
          {task.status === 'approved' && (
            <div className="info-box-success">
              ✓ Task approved! Rating: {task.rating} ⭐
            </div>
          )}

          {/* Chat Button - Shown ONLY if allowed */}
          {canChat && (
            <button className="btn-chat" onClick={() => openChat(taskId)}>
              💬 Chat with {otherChatPartnerName}
            </button>
          )}
        </div>

        {/* Right section - Task info card */}
        <aside className="task-detail-right">
          <div className="task-info-card">
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

            {/* Deadline */}
            <div className="info-item">
              <span className="info-label">Deadline</span>
              <span className="info-value">{task.deadlineHours}h</span>
            </div>

            {/* Time remaining */}
            {task.claimedBy && timeRemaining !== null && (
              <div className="info-item">
                <span className="info-label">Time Remaining</span>
                <span className="info-value warning">{timeRemaining}h</span>
              </div>
            )}

            {/* Divider */}
            <hr className="info-divider" />

            {/* Claimed by */}
            {task.claimedBy && (
              <div className="info-item">
                <span className="info-label">Claimed by</span>
                <span 
                  className="info-value poster-name"
                  onClick={() => navigate(`/profile/${task.claimedBy}`)}
                >
                  {task.claimedBy === user?.id ? 'You' : solverName}
                </span>
              </div>
            )}

            {/* Posted by */}
            <div className="info-item">
              <span className="info-label">Posted by</span>
              <span 
                className="info-value poster-name"
                onClick={() => navigate(`/profile/${task.postedBy}`)}
              >
                {task.postedBy === user?.id ? 'You' : posterName}
              </span>
            </div>

            {/* Created at */}
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Claimed at */}
            {task.claimedAt && (
              <div className="info-item">
                <span className="info-label">Claimed</span>
                <span className="info-value">
                  {new Date(task.claimedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Rating */}
            {task.rating && (
              <div className="info-item">
                <span className="info-label">Rating</span>
                <span className="info-value">{task.rating} ⭐</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}