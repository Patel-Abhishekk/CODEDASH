import React, { useState, useRef, useEffect } from 'react';
import '../styles/SearchFilter.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest-bounty', label: 'Highest Bounty' },
  { value: 'lowest-bounty', label: 'Lowest Bounty' },
  { value: 'most-time', label: 'Most Time Remaining' },
  { value: 'least-time', label: 'Least Time Remaining' },
];

export default function SortDropdown({ value = 'newest', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label || 'Newest First';

  const handleSelect = (val) => {
    onChange && onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="sort-dropdown-container" ref={containerRef}>
      <button
        type="button"
        className="sort-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>Sort by: <strong>{currentLabel}</strong></span>
        <span className="sort-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="sort-dropdown-menu">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sort-option-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span>{opt.label}</span>
              {value === opt.value && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
