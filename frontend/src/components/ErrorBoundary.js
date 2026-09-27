import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong.</h2>
          <p>Please refresh the page or try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
