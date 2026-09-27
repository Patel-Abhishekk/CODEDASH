/**
 * Search & Filter Utility Functions for CodeDash Tasks
 */

// Filter by search term (matches title and description, case-insensitive)
export const filterBySearch = (tasks, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return tasks;
  const q = searchTerm.trim().toLowerCase();
  return tasks.filter((t) => {
    const titleMatch = (t.title || '').toLowerCase().includes(q);
    const descMatch = (t.description || '').toLowerCase().includes(q);
    return titleMatch || descMatch;
  });
};

// Filter by bounty range (presets and/or custom min/max)
export const filterByBounty = (tasks, { min, max, presetRanges = [] }) => {
  const hasCustomMin = min !== undefined && min !== '' && !isNaN(Number(min));
  const hasCustomMax = max !== undefined && max !== '' && !isNaN(Number(max));
  const hasPresets = Array.isArray(presetRanges) && presetRanges.length > 0;

  if (!hasCustomMin && !hasCustomMax && !hasPresets) return tasks;

  return tasks.filter((t) => {
    const bounty = Number(t.bounty) || 0;

    // Custom Min / Max
    if (hasCustomMin && bounty < Number(min)) return false;
    if (hasCustomMax && bounty > Number(max)) return false;

    // Preset ranges (OR logic among presets)
    if (hasPresets) {
      const matchesAnyPreset = presetRanges.some((rangeKey) => {
        switch (rangeKey) {
          case '100-500':
            return bounty >= 100 && bounty <= 500;
          case '500-1000':
            return bounty >= 500 && bounty <= 1000;
          case '1000-5000':
            return bounty >= 1000 && bounty <= 5000;
          case '5000-10000':
            return bounty >= 5000 && bounty <= 10000;
          case '10000+':
            return bounty >= 10000;
          default:
            return true;
        }
      });
      if (!matchesAnyPreset) return false;
    }

    return true;
  });
};

// Filter by deadline (e.g. [1, 2, 6, 12, 24, 48])
export const filterByDeadline = (tasks, selectedDeadlines = []) => {
  if (!selectedDeadlines || selectedDeadlines.length === 0) return tasks;
  const numericDeadlines = selectedDeadlines.map(Number);
  return tasks.filter((t) => {
    const hours = Number(t.deadlineHours || 2);
    return numericDeadlines.includes(hours);
  });
};

// Filter by status (e.g. ['open', 'claimed', 'under-review', 'approved', 'rejected', 'abandoned'])
export const filterByStatus = (tasks, selectedStatuses = []) => {
  if (!selectedStatuses || selectedStatuses.length === 0) return tasks;
  const lowerStatuses = selectedStatuses.map((s) => s.toLowerCase());
  return tasks.filter((t) => lowerStatuses.includes((t.status || '').toLowerCase()));
};

// Filter by task type ('all', 'posted', 'claimed', 'completed')
export const filterByType = (tasks, type = 'all', currentUserId = null) => {
  if (!type || type === 'all' || !currentUserId) return tasks;
  if (type === 'posted') {
    return tasks.filter((t) => String(t.postedBy) === String(currentUserId));
  }
  if (type === 'claimed') {
    return tasks.filter((t) => String(t.claimedBy) === String(currentUserId));
  }
  if (type === 'completed') {
    return tasks.filter(
      (t) =>
        String(t.claimedBy) === String(currentUserId) &&
        (t.status === 'approved' || t.status === 'completed')
    );
  }
  return tasks;
};

// Calculate time remaining in hours
export const getTaskRemainingHours = (task) => {
  if (!task.claimDeadline) return task.deadlineHours || 0;
  const deadline = new Date(task.claimDeadline).getTime();
  const now = Date.now();
  const diffHours = (deadline - now) / (1000 * 60 * 60);
  return diffHours > 0 ? diffHours : 0;
};

// Sort tasks
export const sortTasks = (tasks, sortBy = 'newest') => {
  const copy = [...tasks];
  switch (sortBy) {
    case 'oldest':
      return copy.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
    case 'highest-bounty':
    case 'highest':
      return copy.sort((a, b) => (Number(b.bounty) || 0) - (Number(a.bounty) || 0));
    case 'lowest-bounty':
    case 'lowest':
      return copy.sort((a, b) => (Number(a.bounty) || 0) - (Number(b.bounty) || 0));
    case 'most-time':
      return copy.sort(
        (a, b) => getTaskRemainingHours(b) - getTaskRemainingHours(a)
      );
    case 'least-time':
      return copy.sort(
        (a, b) => getTaskRemainingHours(a) - getTaskRemainingHours(b)
      );
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
  }
};

// Count active filters
export const countActiveFilters = (filters = {}) => {
  let count = 0;
  if (filters.search && filters.search.trim()) count++;
  if (filters.bountyPresetRanges && filters.bountyPresetRanges.length > 0) {
    count += filters.bountyPresetRanges.length;
  }
  if (filters.minBounty !== undefined && filters.minBounty !== '') count++;
  if (filters.maxBounty !== undefined && filters.maxBounty !== '') count++;
  if (filters.deadlines && filters.deadlines.length > 0) {
    count += filters.deadlines.length;
  }
  if (filters.statuses && filters.statuses.length > 0) {
    count += filters.statuses.length;
  }
  if (filters.type && filters.type !== 'all') count++;
  if (filters.sort && filters.sort !== 'newest') count++;
  return count;
};

// Apply all filters pipeline
export const applyAllFilters = (tasks, filters = {}, currentUserId = null) => {
  let result = tasks || [];

  // 1. Task Type (posted / claimed / all)
  if (filters.type && filters.type !== 'all') {
    result = filterByType(result, filters.type, currentUserId);
  }

  // 2. Search keyword
  if (filters.search) {
    result = filterBySearch(result, filters.search);
  }

  // 3. Bounty range
  result = filterByBounty(result, {
    min: filters.minBounty,
    max: filters.maxBounty,
    presetRanges: filters.bountyPresetRanges,
  });

  // 4. Deadlines
  if (filters.deadlines && filters.deadlines.length > 0) {
    result = filterByDeadline(result, filters.deadlines);
  }

  // 5. Statuses
  if (filters.statuses && filters.statuses.length > 0) {
    result = filterByStatus(result, filters.statuses);
  }

  // 6. Sort
  result = sortTasks(result, filters.sort || 'newest');

  return result;
};
