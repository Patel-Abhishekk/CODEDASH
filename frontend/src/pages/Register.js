import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { validateUsername, validateEmail, validatePassword } from '../utils/validation';
import ValidationError from '../components/ValidationError';
import '../styles/Auth.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Handle register form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateUsername(username)) {
      setError('Username: 3-20 chars, alphanumeric + underscore only');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, special char');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Call backend register API
      await userAPI.register(username, email, password);
      
      // Show success message
      alert('Registration successful! Please login.');
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      // Show error message
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <h1 className="logo">CodeDash</h1>
        <h2>Create Account</h2>

        {/* Error message */}
        <ValidationError message={error} />

        {/* Register form */}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john_coder"
              required
            />
          </div>

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

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        {/* Link to login */}
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}