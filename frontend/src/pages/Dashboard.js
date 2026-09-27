import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { taskAPI, userAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TaskFeed from '../components/TaskFeed';
import GhostingCheckModal from '../components/GhostingCheckModal';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SortDropdown from '../components/SortDropdown';
import { applyAllFilters, countActiveFilters } from '../utils/filterUtils';
import '../styles/Dashboard.css';
import '../styles/SearchFilter.css';

export default function Dashboard() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'claimed', 'posted'
  const [checkingGhosting, setCheckingGhosting] = useState(false);
  const [ghostingModalOpen, setGhostingModalOpen] = useState(false);
  const [ghostingResults, setGhostingResults] = useState({ resolvedCount: 0, resolvedTasks: [] });
  
  // Search & Filter State
  const [filters, setFilters] = useState({
    search: '',
    bountyPresetRanges: [],
    minBounty: '',
    maxBounty: '',
    deadlines: [],
    statuses: [],
    sort: 'newest',
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, navigate, loading]);

  // Fetch open tasks on page load
  useEffect(() => {
    fetchOpenTasks();
  }, []);

  // Fetch all open tasks from backend
  const fetchOpenTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getOpenTasks();
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle ghosting check
  const handleCheckGhosting = async () => {
    setCheckingGhosting(true);
    try {
      const response = await taskAPI.autoResolveGhosting();
      const { resolvedCount, resolvedTasks } = response.data;

      setGhostingResults({
        resolvedCount: resolvedCount || 0,
        resolvedTasks: resolvedTasks || [],
      });
      setGhostingModalOpen(true);

      // Refresh task list
      await fetchOpenTasks();

      // Refresh user wallet & escrow data
      if (user?.id) {
        try {
          const userRes = await userAPI.getUserById(user.id);
          if (userRes?.data?.user) {
            updateUser(userRes.data.user);
          }
        } catch (e) {
          console.error('Error refreshing user data:', e);
        }
      }
    } catch (error) {
      console.error('Error checking ghosting:', error);
      alert(error.response?.data?.message || 'Failed to check ghosting tasks');
    } finally {
      setCheckingGhosting(false);
    }
  };

  // Base tasks for current tab
  const getTabBaseTasks = () => {
    if (activeTab === 'open') {
      return tasks.filter(t => t.status === 'open' && t.postedBy !== user?.id);
    } else if (activeTab === 'claimed') {
      return tasks.filter(t => t.claimedBy === user?.id && (t.status === 'claimed' || t.status === 'under-review'));
    } else if (activeTab === 'posted') {
      return tasks.filter(t => t.postedBy === user?.id);
    }
    return [];
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      bountyPresetRanges: [],
      minBounty: '',
      maxBounty: '',
      deadlines: [],
      statuses: [],
      sort: 'newest',
    });
  };

  const baseTasks = getTabBaseTasks();
  const filteredTasks = applyAllFilters(baseTasks, filters, user?.id);
  const activeCount = countActiveFilters(filters);

  const averageRatingFormatted = user?.engineerScore?.averageRating !== undefined && user?.engineerScore?.averageRating !== null
    ? user.engineerScore.averageRating.toFixed(2)
    : '0.00';

  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <Navbar user={user} onLogout={logout} />

      <div className="dashboard-content">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-header">
            <h1>
              {(activeTab === 'open' || activeTab === 'Open') && 'Open Tasks'}
              {(activeTab === 'claimed' || activeTab === 'Claimed') && 'My Claimed Tasks'}
              {(activeTab === 'posted' || activeTab === 'Posted') && 'My Posted Tasks'}
            </h1>
            <button 
              className="btn-post-task"
              onClick={() => navigate('/post-task')}
            >
              + Post Task
            </button>
          </div>

          {/* Search, Filter & Sort Controls for Dashboard */}
          <div className="dashboard-controls">
            <div className="controls-top-row">
              <SearchBar
                value={filters.search}
                onChange={(val) => setFilters({ ...filters, search: val })}
                onClear={() => setFilters({ ...filters, search: '' })}
                placeholder={`Search ${activeTab === 'open' ? 'open' : activeTab} tasks by title or keyword...`}
              />

              <button
                type="button"
                className={`filter-toggle-btn ${activeCount > 0 ? 'has-active' : ''}`}
                onClick={() => {
                  setShowFiltersPanel(!showFiltersPanel);
                  if (window.innerWidth <= 768) {
                    setIsMobileDrawerOpen(true);
                  }
                }}
              >
                <span>⚙️ Filters</span>
                {activeCount > 0 && (
                  <span className="active-filter-badge">{activeCount}</span>
                )}
                <span>{showFiltersPanel ? '▲' : '▼'}</span>
              </button>

              <SortDropdown
                value={filters.sort}
                onChange={(val) => setFilters({ ...filters, sort: val })}
              />
            </div>

            {/* Collapsible Filter Panel (Desktop) */}
            {showFiltersPanel && (
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={resetFilters}
                onApplyFilters={() => setShowFiltersPanel(false)}
                activeFilterCount={activeCount}
              />
            )}

            {/* Mobile Filter Drawer */}
            {isMobileDrawerOpen && (
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={resetFilters}
                onApplyFilters={() => setIsMobileDrawerOpen(false)}
                activeFilterCount={activeCount}
                isMobileDrawer={true}
                onCloseDrawer={() => setIsMobileDrawerOpen(false)}
              />
            )}

            {/* Active Filters Summary Chips */}
            {activeCount > 0 && (
              <div className="active-filters-chips">
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Active Filters:</span>
                {filters.search && (
                  <span className="filter-chip">
                    Search: "{filters.search}"
                    <button className="filter-chip-remove" onClick={() => setFilters({ ...filters, search: '' })}>×</button>
                  </span>
                )}
                {filters.bountyPresetRanges.map(p => (
                  <span key={p} className="filter-chip">
                    Bounty: {p}
                    <button className="filter-chip-remove" onClick={() => setFilters({
                      ...filters,
                      bountyPresetRanges: filters.bountyPresetRanges.filter(id => id !== p)
                    })}>×</button>
                  </span>
                ))}
                {(filters.minBounty || filters.maxBounty) && (
                  <span className="filter-chip">
                    ₹{filters.minBounty || 0} - ₹{filters.maxBounty || '∞'}
                    <button className="filter-chip-remove" onClick={() => setFilters({ ...filters, minBounty: '', maxBounty: '' })}>×</button>
                  </span>
                )}
                {filters.deadlines.map(d => (
                  <span key={d} className="filter-chip">
                    Deadline: {d}h
                    <button className="filter-chip-remove" onClick={() => setFilters({
                      ...filters,
                      deadlines: filters.deadlines.filter(h => h !== d)
                    })}>×</button>
                  </span>
                ))}
                <button
                  onClick={resetFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Task Feed */}
          {loading ? (
            <div className="loading">Loading tasks...</div>
          ) : (
            <TaskFeed
              tasks={filteredTasks}
              refreshTasks={fetchOpenTasks}
              onResetFilters={resetFilters}
              activeFilterCount={activeCount}
            />
          )}
        </main>

        {/* Right Sidebar (User Info) */}
        <aside className="right-sidebar">
          <div className="user-card">
            <h3>Engineer Score</h3>
            <div className="score-stat">
              <span className="label">Rating</span>
              <span className="value">
                {averageRatingFormatted} ⭐
              </span>
            </div>
            <div className="score-stat">
              <span className="label">Tasks Completed</span>
              <span className="value">{user?.engineerScore?.bugsSolved || 0}</span>
            </div>
            <div className="score-stat">
              <span className="label">Wallet Balance</span>
              <span className="value">₹{user?.walletBalance || 0}</span>
            </div>
            <div className="score-stat">
              <span className="label">In Escrow</span>
              <span className="value">₹{user?.escrowHeld || 0}</span>
            </div>
          </div>

          <button 
            className="btn-check-ghosting"
            onClick={handleCheckGhosting}
            disabled={checkingGhosting}
          >
            {checkingGhosting ? 'Checking for abandoned tasks...' : '⏰ Check Abandoned Tasks'}
          </button>
        </aside>
      </div>

      {/* Ghosting Check Modal */}
      <GhostingCheckModal 
        isOpen={ghostingModalOpen}
        onClose={() => {
          setGhostingModalOpen(false);
          fetchOpenTasks();
        }}
        resolvedCount={ghostingResults.resolvedCount}
        resolvedTasks={ghostingResults.resolvedTasks}
      />
    </div>
  );
}