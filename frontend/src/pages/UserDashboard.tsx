import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldAlert, ShieldCheck, Key, Store, ArrowUpDown } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  address: string;
  overallRating: number;
  totalRatings: number;
  userSubmittedRating: number | null;
  userRatingId: string | null;
}

export const UserDashboard: React.FC = () => {
  const { apiFetch, user } = useAuth();

  // Navigation: 'stores' | 'profile'
  const [activeTab, setActiveTab] = useState<'stores' | 'profile'>('stores');

  // Stores Data
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Alerts
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  // Password update form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Fetch stores list
  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (searchAddress) params.append('address', searchAddress);
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);

      const data = await apiFetch(`/user/stores?${params.toString()}`);
      setStores(data.stores);
    } catch (e: any) {
      console.error(e);
      setErrorAlert('Failed to load store listings');
    }
  };

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    }
  }, [activeTab, searchName, searchAddress, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Submit new rating or modify existing rating
  const handleRateStore = async (storeId: string, ratingValue: number, existingRatingId: string | null) => {
    try {
      if (existingRatingId) {
        // PUT modify
        await apiFetch(`/user/ratings/${existingRatingId}`, {
          method: 'PUT',
          body: JSON.stringify({ rating: ratingValue }),
        });
        setSuccessAlert('Rating updated successfully!');
      } else {
        // POST new
        await apiFetch('/user/ratings', {
          method: 'POST',
          body: JSON.stringify({ storeId, rating: ratingValue }),
        });
        setSuccessAlert('Rating submitted successfully!');
      }
      fetchStores();
    } catch (err: any) {
      setErrorAlert(err.message || 'Failed to submit rating');
    }
  };

  // Change password validations & submit
  const validatePasswordForm = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return false;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setPasswordError('New password must be between 8 and 16 characters');
      return false;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpper) {
      setPasswordError('New password must include at least one uppercase letter');
      return false;
    }
    
    if (!hasSpecial) {
      setPasswordError('New password must include at least one special character');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and password confirmation do not match');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!validatePasswordForm()) return;

    setIsUpdatingPassword(true);
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Clear Alerts
  useEffect(() => {
    if (successAlert || errorAlert) {
      const timer = setTimeout(() => {
        setSuccessAlert('');
        setErrorAlert('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successAlert, errorAlert]);

  return (
    <div className="dashboard-wrapper">
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Welcome, {user?.name.split(' ')[0]}!</h1>
          <p>Rate your local outlets, view reviews, and manage your account credentials</p>
        </div>
      </div>

      {/* Alert banners */}
      {successAlert && <div className="alert-banner success">{successAlert}</div>}
      {errorAlert && <div className="alert-banner error">{errorAlert}</div>}

      {/* Tabs */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Store size={16} />
            <span>Store Directories</span>
          </div>
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={16} />
            <span>Update Password</span>
          </div>
        </button>
      </div>

      {/* Stores Feed View */}
      {activeTab === 'stores' && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Registered Store Outlets</h2>
          </div>

          {/* Search panel */}
          <div className="filters-bar">
            <div className="filter-input-wrapper">
              <input
                type="text"
                className="filter-control"
                placeholder="Search by store name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="filter-input-wrapper">
              <input
                type="text"
                className="filter-control"
                placeholder="Search by location / address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Sort:</span>
              <button className="btn-secondary" onClick={() => handleSort('name')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Name <ArrowUpDown size={12} style={{ marginLeft: '0.2rem' }} />
              </button>
              <button className="btn-secondary" onClick={() => handleSort('overallRating')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Rating <ArrowUpDown size={12} style={{ marginLeft: '0.2rem' }} />
              </button>
            </div>
          </div>

          {/* Feed listings */}
          <div className="stores-feed-grid">
            {stores.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No stores registered yet or none match your search.
              </div>
            ) : (
              stores.map((store) => (
                <div key={store.id} className="store-card">
                  <div className="store-card-header">
                    <span className="store-card-title">{store.name}</span>
                  </div>
                  
                  <span className="store-card-address">{store.address}</span>

                  <div className="store-card-divider"></div>

                  <div className="store-card-stats">
                    <div className="rating-metric">
                      <span className="rating-metric-label">Overall Rating</span>
                      <div className="rating-metric-value overall">
                        <Star size={16} fill={store.overallRating > 0 ? '#f59e0b' : 'none'} color="#f59e0b" />
                        <span>{store.overallRating > 0 ? store.overallRating : 'Unrated'}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                          ({store.totalRatings} ratings)
                        </span>
                      </div>
                    </div>

                    <div className="rating-metric">
                      <span className="rating-metric-label">Your Rating</span>
                      <div className="rating-metric-value user-submitted">
                        <Star size={16} fill={store.userSubmittedRating ? '#06b6d4' : 'none'} color="#06b6d4" />
                        <span>{store.userSubmittedRating ? store.userSubmittedRating : 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rating-action-area">
                    <span className="rating-action-label">
                      {store.userSubmittedRating ? 'Modify Rating:' : 'Rate Store:'}
                    </span>
                    <div className="stars-rating-interactive">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isCurrent = store.userSubmittedRating === starValue;
                        const isLessOrEqual = store.userSubmittedRating !== null && starValue <= store.userSubmittedRating;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            className={`star-interactive-btn ${isCurrent || isLessOrEqual ? 'active' : ''}`}
                            onClick={() => handleRateStore(store.id, starValue, store.userRatingId)}
                          >
                            <Star
                              size={18}
                              fill={isCurrent || isLessOrEqual ? (store.userSubmittedRating ? '#06b6d4' : '#f59e0b') : 'none'}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Profile Update view */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '560px', boxShadow: 'none' }}>
            <h2 className="auth-title" style={{ fontSize: '1.5rem', textAlign: 'left', marginBottom: '0.25rem' }}>Update Password</h2>
            <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Secure your account credentials by changing your password</p>

            {passwordError && (
              <div className="alert-banner error">
                <ShieldAlert size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="alert-banner success">
                <ShieldCheck size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="old-pass">Current Password</label>
                <input
                  id="old-pass"
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-pass">New Password</label>
                <input
                  id="new-pass"
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
                <span className="validation-hint">
                  Must be 8-16 characters and contain at least one uppercase letter and one special symbol
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pass">Confirm New Password</label>
                <input
                  id="confirm-pass"
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Account Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
