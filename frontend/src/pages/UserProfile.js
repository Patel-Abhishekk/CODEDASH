import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { userAPI, taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import '../styles/UserProfile.css';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      let userData = null;

      // If viewing own profile and available in Context, start with that
      if (currentUser && currentUser.id === userId) {
        userData = currentUser;
      }

      // Fetch latest user data from API
      try {
        const userRes = await userAPI.getUserById(userId);
        if (userRes.data?.user) {
          userData = userRes.data.user;
        }
      } catch (err) {
        if (!userData) {
          setError('User not found');
          setLoading(false);
          return;
        }
      }

      setProfileUser(userData);

      // Fetch tasks to filter completed ones for this user
      const taskRes = await taskAPI.getOpenTasks();
      const allTasks = taskRes.data?.tasks || [];
      const userCompleted = allTasks.filter(
        t => t.claimedBy === userId && (t.status === 'approved' || t.status === 'completed')
      );
      setCompletedTasks(userCompleted);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <Navbar user={currentUser} onLogout={logout} />
        <div className="loading-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="user-profile-page">
        <Navbar user={currentUser} onLogout={logout} />
        <div className="error-container">
          <p>{error || 'User not found'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics & formatted values
  const initials = profileUser.username
    ? profileUser.username.substring(0, 2).toUpperCase()
    : 'U';

  const memberSince = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'May 20, 2026';

  const totalEarned = completedTasks.reduce((sum, t) => sum + (t.bounty || 0), 0);

  const averageRating = profileUser.engineerScore?.averageRating || 0;
  const totalRatings = profileUser.engineerScore?.totalRatings || 0;
  const bugsSolved = profileUser.engineerScore?.bugsSolved || completedTasks.length || 0;
  const tasksCompletedCount = completedTasks.length || profileUser.tasksCompleted?.length || 0;

  const totalClaimedCount = profileUser.tasksClaimed?.length || tasksCompletedCount;
  const successRate = totalClaimedCount > 0
    ? Math.round((tasksCompletedCount / totalClaimedCount) * 100)
    : 100;

  return (
    <div className="user-profile-page">
      <Navbar user={currentUser} onLogout={logout} />

      <div className="user-profile-container">
        {/* Left Section - Main Content */}
        <div className="profile-left">
          {/* Back button */}
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>

          {/* User Header Card */}
          <div className="user-header-card">
            <div className="avatar">{initials}</div>
            <div className="user-info-text">
              <div className="user-title-row">
                <h1>{profileUser.username}</h1>
                <span className="status-badge active">Active</span>
              </div>
              <p className="user-email">{profileUser.email}</p>
              <p className="user-meta">Member since {memberSince}</p>
            </div>
          </div>

          {/* Engineer Score Summary */}
          <div className="score-summary-card">
            <h3>Engineer Score</h3>
            <div className="score-grid">
              <div className="score-stat-box">
                <span className="score-label">Average Rating</span>
                <span className="score-value warning">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} ⭐` : 'N/A'}
                </span>
              </div>
              <div className="score-stat-box">
                <span className="score-label">Total Ratings</span>
                <span className="score-value">{totalRatings}</span>
              </div>
              <div className="score-stat-box">
                <span className="score-label">Tasks Completed</span>
                <span className="score-value">{tasksCompletedCount}</span>
              </div>
              <div className="score-stat-box">
                <span className="score-label">Bugs Solved</span>
                <span className="score-value">{bugsSolved}</span>
              </div>
              <div className="score-stat-box">
                <span className="score-label">Success Rate</span>
                <span className="score-value success">{successRate}%</span>
              </div>
            </div>
          </div>

          {/* Completed Tasks List */}
          <div className="completed-tasks-card">
            <h3>Completed Tasks</h3>
            {completedTasks.length === 0 ? (
              <div className="empty-state">
                <p>No completed tasks yet</p>
              </div>
            ) : (
              <div className="tasks-table-container">
                <table className="completed-tasks-table">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Bounty</th>
                      <th>Rating</th>
                      <th>Date Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map(task => (
                      <tr 
                        key={task.id} 
                        onClick={() => navigate(`/task/${task.id}`)} 
                        className="clickable-row"
                      >
                        <td className="task-name-cell">{task.title}</td>
                        <td className="bounty-cell">₹{task.bounty}</td>
                        <td className="rating-cell">
                          {task.rating ? `${task.rating} ⭐` : 'N/A'}
                        </td>
                        <td className="date-cell">
                          {task.approvedAt
                            ? new Date(task.approvedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : task.submittedAt
                            ? new Date(task.submittedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Stats Card */}
        <aside className="profile-right">
          <div className="profile-stats-card">
            <div className="rating-display-header">
              <span className="large-rating">
                {averageRating > 0 ? `${averageRating.toFixed(1)} ⭐` : 'New User'}
              </span>
              <span className="rating-subtext">Overall Rating</span>
            </div>

            <hr className="divider" />

            <div className="stat-list">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">{memberSince}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tasks Completed</span>
                <span className="stat-value">{tasksCompletedCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Earned</span>
                <span className="stat-value highlight">₹{totalEarned.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">{successRate}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tasks Posted</span>
                <span className="stat-value">{profileUser.tasksPosted?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tasks Claimed</span>
                <span className="stat-value">{totalClaimedCount}</span>
              </div>
            </div>

            <hr className="divider" />

            {/* Skills & Expertise Tags */}
            <div className="skills-section">
              <span className="skills-title">Skills & Expertise</span>
              <div className="skills-tags">
                <span className="skill-tag">JavaScript</span>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Node.js</span>
                <span className="skill-tag">Bug Fixing</span>
                <span className="skill-tag">Full Stack</span>
              </div>
            </div>

            <hr className="divider" />

            {/* Action Buttons */}
            <div className="action-buttons-section">
              {isOwnProfile ? (
                <>
                  <button className="btn-profile-action primary" onClick={() => navigate('/dashboard')}>
                    View Wallet & Dashboard
                  </button>
                  <button className="btn-profile-action secondary" onClick={() => navigate('/task-history')}>
                    View Full Task History
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-profile-action primary" onClick={() => alert('User bookmarked!')}>
                    ⭐ Bookmark Engineer
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
