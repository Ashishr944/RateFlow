import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface SignupProps {
  onNavigateToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigateToLogin }) => {
  const { login, apiFetch } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  // Field errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
  });

  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: string, value: string) => {
    let errMsg = '';
    switch (field) {
      case 'name':
        if (!value) {
          errMsg = 'Name is required';
        } else if (value.length < 20 || value.length > 60) {
          errMsg = 'Name must be between 20 and 60 characters';
        }
        break;
      case 'email':
        if (!value) {
          errMsg = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errMsg = 'Invalid email format';
        }
        break;
      case 'address':
        if (!value) {
          errMsg = 'Address is required';
        } else if (value.length > 400) {
          errMsg = 'Address cannot exceed 400 characters';
        }
        break;
      case 'password':
        if (!value) {
          errMsg = 'Password is required';
        } else if (value.length < 8 || value.length > 16) {
          errMsg = 'Password must be between 8 and 16 characters';
        } else {
          const hasUppercase = /[A-Z]/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          if (!hasUppercase) {
            errMsg = 'Must include at least one uppercase letter';
          } else if (!hasSpecial) {
            errMsg = 'Must include at least one special character';
          }
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: errMsg }));
    return errMsg === '';
  };

  const handleBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');

    const isNameValid = validateField('name', name);
    const isEmailValid = validateField('email', email);
    const isAddressValid = validateField('address', address);
    const isPasswordValid = validateField('password', password);

    if (!isNameValid || !isEmailValid || !isAddressValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, address, password }),
      });

      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(() => {
        login(data.token, data.user);
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register to submit and modify store ratings</p>

        {serverError && (
          <div className="alert-banner error">
            <ShieldAlert size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner success">
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Sir Lancelot The Brave Knight"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => handleBlur('name', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name ? (
              <span className="error-text">{errors.name}</span>
            ) : (
              <span className="validation-hint">Min 20, max 60 characters. Current: {name.length}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="e.g. lancelot@knights.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder="e.g. Joyous Gard Castle, Knight Quarters, United Kingdom"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={(e) => handleBlur('address', e.target.value)}
              rows={3}
              disabled={isSubmitting}
              style={{ resize: 'vertical' }}
            />
            {errors.address ? (
              <span className="error-text">{errors.address}</span>
            ) : (
              <span className="validation-hint">Max 400 characters. Current: {address.length}/400</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.password ? (
              <span className="error-text">{errors.password}</span>
            ) : (
              <span className="validation-hint">
                8-16 characters, at least 1 uppercase letter and 1 special symbol
              </span>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Registering...</span>
                </>
              ) : (
                'Create User Account'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>
            Log in here
          </a>
        </div>
      </div>
    </div>
  );
};
