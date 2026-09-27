export const NOTIFICATION_TYPES = {
  TASK_CLAIMED: 'task_claimed',
  PROOF_SUBMITTED: 'proof_submitted',
  TASK_APPROVED: 'task_approved',
  TASK_REJECTED: 'task_rejected',
  TASK_ABANDONED: 'task_abandoned',
  NEW_MESSAGE: 'new_message',
};

export const getNotificationConfig = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.TASK_CLAIMED:
      return {
        icon: '🔔',
        badgeColor: '#2563EB',
        defaultActionLabel: 'View Task',
        title: 'Task Claimed',
      };
    case NOTIFICATION_TYPES.PROOF_SUBMITTED:
      return {
        icon: '📋',
        badgeColor: '#F59E0B',
        defaultActionLabel: 'Review Proof',
        title: 'Proof Submitted',
      };
    case NOTIFICATION_TYPES.TASK_APPROVED:
      return {
        icon: '✅',
        badgeColor: '#10B981',
        defaultActionLabel: 'View Task',
        title: 'Task Approved',
      };
    case NOTIFICATION_TYPES.TASK_REJECTED:
      return {
        icon: '❌',
        badgeColor: '#DC2626',
        defaultActionLabel: 'Resubmit Proof',
        title: 'Proof Rejected',
      };
    case NOTIFICATION_TYPES.TASK_ABANDONED:
      return {
        icon: '⏰',
        badgeColor: '#F59E0B',
        defaultActionLabel: 'View Task',
        title: 'Task Abandoned',
      };
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return {
        icon: '💬',
        badgeColor: '#2563EB',
        defaultActionLabel: 'Open Chat',
        title: 'New Message',
      };
    default:
      return {
        icon: '🔔',
        badgeColor: '#6B7280',
        defaultActionLabel: 'View',
        title: 'Notification',
      };
  }
};

export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Recently';
  const now = new Date();
  const date = new Date(dateInput);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 10) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
