import React, { useEffect } from 'react';
import '../styles/Notifications.css';

export function Toast({ toast, onDismiss, onAction }) {
  const { id, type = 'info', title, message, actionLabel, actionUrl, duration = 5000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction(toast);
    }
    onDismiss(id);
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
        {(actionLabel || actionUrl) && (
          <button className="toast-action-btn" onClick={handleAction}>
            {actionLabel || 'View'}
          </button>
        )}
      </div>
      <button 
        className="toast-close-btn" 
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
      >
        ×
      </button>
      {duration > 0 && (
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${duration}ms` }} 
        />
      )}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss, onAction }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

export default Toast;
