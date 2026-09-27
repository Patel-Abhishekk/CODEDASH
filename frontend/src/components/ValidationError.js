import React from 'react';

export default function ValidationError({ message }) {
  if (!message) return null;
  
  return (
    <div className="validation-error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
      ⚠️ {message}
    </div>
  );
}
