import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onNavigateToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToSignup }) => {
  const { login, apiFetch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    let isValid = true;
    
    // Email validate
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validate
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user);
    } catch (err: any) {
      setServerError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1'
          }}>
            <Star size={24} fill="#6366f1" />
          </div>
        </div>
        
        <h2 className="auth-title">Welcome to RateFlow</h2>
        <p className="auth-subtitle">Log in to view ratings, manage stores, and more</p>

        {serverError && (
          <div className="alert-banner error">
            <ShieldAlert size={18} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-control ${emailError ? 'error' : ''}`}
              placeholder="e.g. admin@rateflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {emailError && <span className="error-text">{emailError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-control ${passwordError ? 'error' : ''}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            {passwordError && <span className="error-text">{passwordError}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Don't have a user account?{' '}
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>
            Sign up here
          </a>
        </div>
      </div>
    </div>
  );
};
