import React from 'react';
import '../styles/SearchFilter.css';

export default function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search tasks by title or keyword...',
}) {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClear}
            title="Clear search"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
