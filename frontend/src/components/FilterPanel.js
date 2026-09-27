import React from 'react';
import '../styles/SearchFilter.css';

const BOUNTY_PRESETS = [
  { id: '100-500', label: '₹100 - ₹500' },
  { id: '500-1000', label: '₹500 - ₹1,000' },
  { id: '1000-5000', label: '₹1,000 - ₹5,000' },
  { id: '5000-10000', label: '₹5,000 - ₹10,000' },
  { id: '10000+', label: '₹10,000+' },
];

const DEADLINE_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 2, label: '2 hours' },
  { hours: 6, label: '6 hours' },
  { hours: 12, label: '12 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
];

const STATUS_OPTIONS = [
  { id: 'open', label: 'Open' },
  { id: 'claimed', label: 'Claimed' },
  { id: 'under-review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'abandoned', label: 'Abandoned' },
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'posted', label: 'Posted (by me)' },
  { id: 'claimed', label: 'Claimed (by me)' },
];

export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  showStatusFilter = false,
  showTypeFilter = false,
  activeFilterCount = 0,
  isMobileDrawer = false,
  onCloseDrawer,
}) {
  const {
    bountyPresetRanges = [],
    minBounty = '',
    maxBounty = '',
    deadlines = [],
    statuses = [],
    type = 'all',
  } = filters || {};

  // Toggle bounty preset checkbox
  const handleBountyPresetToggle = (presetId) => {
    const exists = bountyPresetRanges.includes(presetId);
    const updated = exists
      ? bountyPresetRanges.filter((id) => id !== presetId)
      : [...bountyPresetRanges, presetId];
    onFilterChange && onFilterChange({ ...filters, bountyPresetRanges: updated });
  };

  // Toggle deadline checkbox
  const handleDeadlineToggle = (hours) => {
    const exists = deadlines.includes(hours);
    const updated = exists
      ? deadlines.filter((h) => h !== hours)
      : [...deadlines, hours];
    onFilterChange && onFilterChange({ ...filters, deadlines: updated });
  };

  // Toggle status checkbox
  const handleStatusToggle = (statusId) => {
    const exists = statuses.includes(statusId);
    const updated = exists
      ? statuses.filter((s) => s !== statusId)
      : [...statuses, statusId];
    onFilterChange && onFilterChange({ ...filters, statuses: updated });
  };

  // Change task type radio
  const handleTypeChange = (typeId) => {
    onFilterChange && onFilterChange({ ...filters, type: typeId });
  };

  const panelContent = (
    <div className="filter-panel-inner">
      <div className="filter-panel-header">
        <h4>
          <span>⚙️ Filters</span>
          {activeFilterCount > 0 && (
            <span className="active-filter-badge">{activeFilterCount}</span>
          )}
        </h4>
        {isMobileDrawer && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onCloseDrawer}
            title="Close filters"
          >
            ×
          </button>
        )}
      </div>

      <div className="filter-sections-grid">
        {/* Bounty Range Section */}
        <div className="filter-section">
          <div className="filter-section-title">Bounty Range</div>
          <div className="filter-options-group">
            {BOUNTY_PRESETS.map((preset) => (
              <label key={preset.id} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={bountyPresetRanges.includes(preset.id)}
                  onChange={() => handleBountyPresetToggle(preset.id)}
                />
                <span>{preset.label}</span>
              </label>
            ))}
          </div>

          {/* Custom Min / Max Range */}
          <div className="range-inputs-container">
            <span className="range-inputs-label">Custom Range:</span>
            <div className="range-inputs-row">
              <div className="range-input-box">
                <span className="range-currency-prefix">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minBounty}
                  onChange={(e) =>
                    onFilterChange &&
                    onFilterChange({ ...filters, minBounty: e.target.value })
                  }
                  min="0"
                />
              </div>
              <span className="range-separator">-</span>
              <div className="range-input-box">
                <span className="range-currency-prefix">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxBounty}
                  onChange={(e) =>
                    onFilterChange &&
                    onFilterChange({ ...filters, maxBounty: e.target.value })
                  }
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Deadline Section */}
        <div className="filter-section">
          <div className="filter-section-title">Deadline</div>
          <div className="filter-options-group">
            {DEADLINE_OPTIONS.map((opt) => (
              <label key={opt.hours} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={deadlines.includes(opt.hours)}
                  onChange={() => handleDeadlineToggle(opt.hours)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Optional Status Filter (History page or full feed) */}
        {showStatusFilter && (
          <div className="filter-section">
            <div className="filter-section-title">Task Status</div>
            <div className="filter-options-group">
              {STATUS_OPTIONS.map((status) => (
                <label key={status.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={statuses.includes(status.id)}
                    onChange={() => handleStatusToggle(status.id)}
                  />
                  <span>{status.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Optional Task Type Filter (History page) */}
        {showTypeFilter && (
          <div className="filter-section">
            <div className="filter-section-title">Task Type</div>
            <div className="filter-options-group">
              {TYPE_OPTIONS.map((opt) => (
                <label key={opt.id} className="filter-radio">
                  <input
                    type="radio"
                    name="taskTypeFilter"
                    value={opt.id}
                    checked={type === opt.id}
                    onChange={() => handleTypeChange(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="filter-panel-footer">
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="btn-filter-clear"
            onClick={onClearFilters}
          >
            Clear All
          </button>
        )}
        <button
          type="button"
          className="btn-filter-apply"
          onClick={() => {
            onApplyFilters && onApplyFilters();
            if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="filter-panel-drawer" onClick={onCloseDrawer}>
        <div
          className="filter-panel-drawer-content"
          onClick={(e) => e.stopPropagation()}
        >
          {panelContent}
        </div>
      </div>
    );
  }

  return <div className="filter-panel">{panelContent}</div>;
}
