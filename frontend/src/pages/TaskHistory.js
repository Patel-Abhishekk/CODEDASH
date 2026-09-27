import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { taskAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import { filterBySearch } from '../utils/filterUtils';
import '../styles/TaskHistory.css';
import '../styles/SearchFilter.css';

export default function TaskHistory() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'posted', 'claimed', 'completed'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'claimed', 'under-review', 'approved', 'rejected', 'abandoned'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Protect route
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch all tasks on load
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getOpenTasks();
      setTasks(response.data?.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks for history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Base list: Tasks where user participated (posted OR claimed)
  const userParticipatedTasks = tasks.filter(
    t => t.postedBy === user?.id || t.claimedBy === user?.id
  );

  // Calculate Stats Summary for Right Sidebar
  const postedTasks = tasks.filter(t => t.postedBy === user?.id);
  const claimedTasks = tasks.filter(t => t.claimedBy === user?.id);
  const completedTasks = tasks.filter(
    t => t.claimedBy === user?.id && (t.status === 'approved' || t.status === 'completed')
  );

  const totalParticipatedCount = userParticipatedTasks.length;
  const postedCount = postedTasks.length;
  const claimedCount = claimedTasks.length;
  const completedCount = completedTasks.length;

  const totalEarned = completedTasks.reduce((sum, t) => sum + (t.bounty || 0), 0);
  const successRate = claimedCount > 0
    ? Math.round((completedCount / claimedCount) * 100)
    : (totalParticipatedCount > 0 ? Math.round((completedCount / totalParticipatedCount) * 100) : 0);

  // Apply Type Filter
  let filteredTasks = userParticipatedTasks.filter(task => {
    if (typeFilter === 'posted') return task.postedBy === user?.id;
    if (typeFilter === 'claimed') return task.claimedBy === user?.id;
    if (typeFilter === 'completed') {
      return task.claimedBy === user?.id && (task.status === 'approved' || task.status === 'completed');
    }
    return true;
  });

  // Apply Status Filter
  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
  }

  // Apply Search Filter
  if (searchQuery && searchQuery.trim()) {
    filteredTasks = filterBySearch(filteredTasks, searchQuery);
  }

  // Apply Sorting
  filteredTasks.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'highest') {
      return (b.bounty || 0) - (a.bounty || 0);
    } else if (sortBy === 'lowest') {
      return (a.bounty || 0) - (b.bounty || 0);
    }
    return 0;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + tasksPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'under-review':
        return 'Under Review';
      case 'open':
        return 'Open';
      case 'claimed':
        return 'Claimed';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  return (
    <div className="task-history-page">
      <Navbar user={user} onLogout={logout} />

      <div className="task-history-container">
        {/* LEFT SECTION - Filters & Tabs */}
        <aside className="history-filters">
          <div className="filter-group">
            <h3 className="filter-title">FILTER BY TYPE</h3>
            <div className="filter-buttons-list">
              <button
                className={`filter-button ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Tasks
              </button>
              <button
                className={`filter-button ${typeFilter === 'posted' ? 'active' : ''}`}
                onClick={() => setTypeFilter('posted')}
              >
                Posted
              </button>
              <button
                className={`filter-button ${typeFilter === 'claimed' ? 'active' : ''}`}
                onClick={() => setTypeFilter('claimed')}
              >
                Claimed
              </button>
              <button
                className={`filter-button ${typeFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setTypeFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">STATUS FILTER</h3>
            <div className="status-tabs-list">
              <button
                className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Statuses
              </button>
              <button
                className={`status-tab ${statusFilter === 'open' ? 'active' : ''}`}
                onClick={() => setStatusFilter('open')}
              >
                Open
              </button>
              <button
                className={`status-tab ${statusFilter === 'claimed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('claimed')}
              >
                Claimed
              </button>
              <button
                className={`status-tab ${statusFilter === 'under-review' ? 'active' : ''}`}
                onClick={() => setStatusFilter('under-review')}
              >
                Under Review
              </button>
              <button
                className={`status-tab ${statusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </button>
              <button
                className={`status-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </button>
              <button
                className={`status-tab ${statusFilter === 'abandoned' ? 'active' : ''}`}
                onClick={() => setStatusFilter('abandoned')}
              >
                Abandoned
              </button>
            </div>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">SORT BY</h3>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Bounty</option>
              <option value="lowest">Lowest Bounty</option>
            </select>
          </div>
        </aside>

        {/* CENTER SECTION - Task History List */}
        <main className="history-list">
          <div className="history-list-header">
            <h2>Task History</h2>
            <span className="results-count">{filteredTasks.length} task(s) found</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search history by task title or description..."
            />
          </div>

          {loading ? (
            <div className="loading">Loading task history...</div>
          ) : paginatedTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="cards-list">
              {paginatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-history-card"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="card-top">
                    <h3 className="card-title">{task.title}</h3>
                    <span className="card-bounty">₹{task.bounty}</span>
                  </div>

                  <p className="card-description">
                    {task.description.length > 120
                      ? `${task.description.substring(0, 120)}...`
                      : task.description}
                  </p>

                  <div 
                    className="task-poster-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.postedBy) navigate(`/profile/${task.postedBy}`);
                    }}
                    style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', cursor: 'pointer' }}
                  >
                    Posted by: <span style={{ color: '#2563EB', fontWeight: 600 }}>{task.postedByUsername || 'User'}</span>
                  </div>

                  <div className="card-bottom">
                    <div className="card-meta">
                      <span className={`status-badge ${task.status}`}>
                        Status: {getStatusLabel(task.status)}
                      </span>
                      <span className="card-date">{formatDate(task.createdAt)}</span>
                    </div>

                    <div className="card-role-tag">
                      {task.postedBy === user?.id ? (
                        <span className="role-posted">Posted</span>
                      ) : (
                        <span className="role-claimed">Claimed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredTasks.length > 10 && (
            <div className="history-pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR - Stats Summary */}
        <aside className="history-stats">
          <div className="stats-card">
            <h3 className="stats-card-title">TASK HISTORY STATS</h3>

            <div className="stats-stat-list">
              <div className="stats-item">
                <span className="stats-label">Total Participated</span>
                <span className="stats-value">{totalParticipatedCount}</span>
              </div>

              <div className="stats-item">
                <span className="stats-label">Tasks Posted</span>
                <span className="stats-value">{postedCount}</span>
              </div>

              <div className="stats-item">
                <span className="stats-label">Tasks Claimed</span>
                <span className="stats-value">{claimedCount}</span>
              </div>

              <div className="stats-item">
                <span className="stats-label">Tasks Completed</span>
                <span className="stats-value highlight-green">{completedCount}</span>
              </div>

              <div className="stats-item">
                <span className="stats-label">Total Earned</span>
                <span className="stats-value highlight-blue">₹{totalEarned.toLocaleString()}</span>
              </div>

              <div className="stats-item">
                <span className="stats-label">Success Rate</span>
                <span className="stats-value">{successRate}%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
