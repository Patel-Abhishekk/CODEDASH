import React from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import '../styles/TaskFeed.css';
import '../styles/SearchFilter.css';

export default function TaskFeed({ tasks, refreshTasks, onResetFilters, activeFilterCount = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="task-feed">
      {tasks && tasks.length > 0 ? (
        <div className="tasks-grid">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onTaskClick={() => navigate(`/task/${task.id}`)}
              onRefresh={refreshTasks}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          <h3>No tasks found</h3>
          <p>
            {activeFilterCount > 0
              ? 'No tasks matched your current search and filter settings. Try broadening your criteria.'
              : 'There are currently no tasks in this category.'}
          </p>
          {activeFilterCount > 0 && onResetFilters && (
            <button className="btn-reset-search" onClick={onResetFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}