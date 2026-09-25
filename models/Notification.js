/**
 * Notification Data Model for CodeDash
 *
 * Fields:
 * - id: String (unique timestamp/uuid)
 * - userId: String (recipient user ID)
 * - type: String (task_claimed, proof_submitted, task_approved, task_rejected, task_abandoned, new_message)
 * - message: String (primary text displayed)
 * - taskId: String (related task ID, if applicable)
 * - relatedUserId: String (user who performed the action)
 * - read: Boolean (defaults to false)
 * - createdAt: Date / ISO String
 * - actionUrl: String (relative URL for user action)
 * - metadata: Object (bounty, rating, reason, deadline, preview, etc.)
 */

const NOTIFICATION_TYPES = {
  TASK_CLAIMED: 'task_claimed',
  PROOF_SUBMITTED: 'proof_submitted',
  TASK_APPROVED: 'task_approved',
  TASK_REJECTED: 'task_rejected',
  TASK_ABANDONED: 'task_abandoned',
  NEW_MESSAGE: 'new_message',
};

const createNotificationObject = ({
  userId,
  type,
  message,
  taskId = null,
  relatedUserId = null,
  actionUrl = '',
  metadata = {},
}) => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
    userId: String(userId),
    type,
    message,
    taskId: taskId ? String(taskId) : null,
    relatedUserId: relatedUserId ? String(relatedUserId) : null,
    actionUrl: actionUrl || (taskId ? `/task/${taskId}` : ''),
    metadata: metadata || {},
    read: false,
    createdAt: new Date().toISOString(),
  };
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotificationObject,
};
