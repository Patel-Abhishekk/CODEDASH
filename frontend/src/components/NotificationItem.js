import React from 'react';
import { getNotificationConfig, formatRelativeTime } from '../utils/notificationTypes';
import '../styles/Notifications.css';

export default function NotificationItem({
  notification,
  onItemClick,
  onActionClick,
  onDismiss,
}) {
  const {
    id,
    type,
    message,
    metadata = {},
    read,
    createdAt,
  } = notification;

  const config = getNotificationConfig(type);

  // Compute action button label based on type
  const getActionLabel = () => {
    switch (type) {
      case 'task_claimed':
        return 'View Task';
      case 'proof_submitted':
        return 'Review Proof';
      case 'task_approved':
        return 'View Task';
      case 'task_rejected':
        return 'Resubmit Proof';
      case 'task_abandoned':
        return 'View Task';
      case 'new_message':
        return 'Open Chat';
      default:
        return config.defaultActionLabel || 'View';
    }
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(notification);
    } else if (onItemClick) {
      onItemClick(notification);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const renderStars = (rating) => {
    const num = Math.min(Math.max(Math.round(rating || 0), 1), 5);
    return '⭐'.repeat(num);
  };

  return (
    <div
      className={`notification-item type-${type} ${read ? 'read' : 'unread'}`}
      onClick={() => onItemClick && onItemClick(notification)}
      role="button"
      tabIndex={0}
    >
      <div className="notification-icon-wrapper">
        <span className="notification-icon">{config.icon}</span>
      </div>

      <div className="notification-body">
        <div className="notification-message">
          {message}
        </div>

        {/* Dynamic metadata display matching the 6 notification types */}
        <div className="notification-meta">
          {type === 'task_claimed' && (
            <>
              {metadata.bounty && <span className="notification-meta-tag">Bounty: ₹{metadata.bounty}</span>}
              {metadata.deadlineHours && <span className="notification-meta-tag">Deadline: {metadata.deadlineHours}h</span>}
            </>
          )}

          {type === 'proof_submitted' && (
            <span className="notification-meta-tag" style={{ color: '#D97706', backgroundColor: '#FEF3C7' }}>
              Status: Under Review
            </span>
          )}

          {type === 'task_approved' && (
            <>
              {metadata.rating && (
                <span className="notification-meta-tag">
                  Rating: {renderStars(metadata.rating)} ({metadata.rating} stars)
                </span>
              )}
              {metadata.earned && (
                <span className="notification-meta-tag" style={{ color: '#059669', backgroundColor: '#D1FAE5' }}>
                  Earned: ₹{metadata.earned}
                </span>
              )}
            </>
          )}

          {type === 'task_rejected' && metadata.reason && (
            <span className="notification-meta-tag" style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}>
              Reason: {metadata.reason}
            </span>
          )}

          {type === 'task_abandoned' && (
            <span className="notification-meta-tag" style={{ color: '#D97706', backgroundColor: '#FEF3C7' }}>
              Split: 50% to you {metadata.splitAmount ? `(₹${metadata.splitAmount})` : ''}, 50% to other
            </span>
          )}

          {type === 'new_message' && metadata.preview && (
            <span className="notification-meta-tag" style={{ fontStyle: 'italic' }}>
              "{metadata.preview}"
            </span>
          )}
        </div>

        <div className="notification-footer">
          <span className="notification-timestamp">
            🕒 {formatRelativeTime(createdAt)}
          </span>
          <button className="notification-action-btn" onClick={handleAction}>
            {getActionLabel()}
          </button>
        </div>
      </div>

      <button
        className="btn-dismiss-notif"
        onClick={handleDismiss}
        title="Delete notification"
        aria-label="Delete notification"
      >
        ×
      </button>

      {!read && <span className="unread-dot" title="Unread" />}
    </div>
  );
}
