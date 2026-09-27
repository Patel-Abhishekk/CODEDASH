import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { taskAPI } from '../utils/api';
import '../styles/TaskCard.css';

export default function TaskCard({ task, onTaskClick, onRefresh }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [claiming, setClaiming] = React.useState(false);

  // Handle claim task button
  const handleClaim = async (e) => {
    e.stopPropagation();
    setClaiming(true);

    try {
      // Call backend claim API
      await taskAPI.claimTask(task.id, user.id);
      showToast({
        type: 'success',
        title: 'Task Claimed',
        message: 'Task claimed! Check chat with poster.',
        actionLabel: 'View Task',
        actionUrl: `/task/${task.id}`,
      });
      if (onRefresh) onRefresh(); // Refresh task list
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Claim Failed',
        message: error.response?.data?.message || 'Failed to claim task',
      });
    } finally {
      setClaiming(false);
    }
  };

  // Handle username profile click
  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (task.postedBy) {
      navigate(`/profile/${task.postedBy}`);
    }
  };

  // Calculate hours remaining
  const getHoursRemaining = () => {
    if (!task.claimDeadline) return null;
    const deadline = new Date(task.claimDeadline);
    const now = new Date();
    const hoursLeft = Math.ceil((deadline - now) / (1000 * 60 * 60));
    return hoursLeft > 0 ? hoursLeft : 0;
  };

  const hoursRemaining = getHoursRemaining();
  const posterName = task.postedByUsername || (task.postedBy === user?.id ? user?.username : 'User');
  const posterAvatarLetter = posterName ? posterName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="task-card" onClick={onTaskClick}>
      {/* Task Header */}
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`task-status ${task.status}`}>
          {task.status}
        </span>
      </div>

      {/* Task Description */}
      <p className="task-description">
        {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
      </p>

      {/* Task Meta Info */}
      <div className="task-meta">
        <div className="meta-item">
          <span className="meta-label">Bounty</span>
          <span className="meta-value">₹{task.bounty}</span>
        </div>

        <div className="meta-item">
          <span className="meta-label">Deadline</span>
          <span className="meta-value">{task.deadlineHours}h</span>
        </div>

        {hoursRemaining !== null && (
          <div className="meta-item">
            <span className="meta-label">Time Left</span>
            <span className="meta-value">{hoursRemaining}h</span>
          </div>
        )}
      </div>

      {/* Task Poster Info */}
      <div className="task-poster" onClick={handleProfileClick}>
        <div className="poster-avatar">{posterAvatarLetter}</div>
        <span>Posted by:</span>
        <span className="poster-name">{posterName}</span>
      </div>

      {/* Claim Button - Only show if task is open and user is not the poster */}
      {task.status === 'open' && task.postedBy !== user?.id && (
        <button 
          className="btn-claim"
          onClick={handleClaim}
          disabled={claiming}
        >
          {claiming ? 'Claiming...' : 'Claim Task'}
        </button>
      )}

      {/* Info if user already claimed */}
      {task.claimedBy === user?.id && (
        <div className="task-claimed-by-me">
          ✓ You have claimed this task
        </div>
      )}

      {/* Info if user posted this */}
      {task.postedBy === user?.id && (
        <div className="task-posted-by-me">
          📤 You posted this task
        </div>
      )}
    </div>
  );
}