import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import ValidationError from '../components/ValidationError';
import '../styles/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email format
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password not empty
    if (!password || password.length < 8) {
      setError('Email or password incorrect'); // Don't give explicit password rule on login
      return;
    }

    setLoading(true);

    try {
      // Call backend login API
      const response = await userAPI.login(email.trim(), password);
      const { token, user } = response.data;

      // Store user + token in context
      login(user, token, rememberMe);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Show user-friendly error message
      const message = err.response?.data?.message || 'Email or password incorrect';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <h1 className="logo">CodeDash</h1>
        <h2>Login</h2>

        {/* Error message */}
        <ValidationError message={error} />

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group remember-me-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '14px', color: '#4B5563' }}>
              Remember me on this device
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Link to register */}
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}