import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldAlert, ShieldCheck, Key, Store, Users, Calendar, ArrowUpDown } from 'lucide-react';

interface Reviewer {
  ratingId: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    address: string;
  };
}

interface OwnerData {
  hasStore: boolean;
  message?: string;
  store?: {
    id: string;
    name: string;
    email: string;
    address: string;
  };
  averageRating?: number;
  totalRatings?: number;
  reviewers?: Reviewer[];
}

export const OwnerDashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  
  // Navigation: 'dashboard' | 'profile'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sorting for reviewers table
  const [reviewersList, setReviewersList] = useState<Reviewer[]>([]);
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Password update form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Alerts
  const [errorAlert, setErrorAlert] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/owner/dashboard');
      setDashboardData(data);
      if (data.hasStore && data.reviewers) {
        setReviewersList(data.reviewers);
      }
    } catch (e: any) {
      console.error(e);
      setErrorAlert(e.message || 'Failed to load owner dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Handle local sorting of reviewers in table
  useEffect(() => {
    if (reviewersList.length === 0) return;

    const sorted = [...reviewersList];
    const order = sortOrder === 'desc' ? -1 : 1;

    sorted.sort((a, b) => {
      if (sortField === 'name') {
        return a.user.name.localeCompare(b.user.name) * order;
      }
      if (sortField === 'email') {
        return a.user.email.localeCompare(b.user.email) * order;
      }
      if (sortField === 'rating') {
        return (a.rating - b.rating) * order;
      }
      // default: date
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
    });

    setReviewersList(sorted);
  }, [sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Password update validation and submission
  const validatePasswordForm = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
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
      setPasswordError('New password and confirmation do not match');
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
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="loading-spinner" style={{ width: '2.5rem', height: '2.5rem' }}></span>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Store Owner Dashboard</h1>
          <p>Analyze reviewer lists, monitor rating averages, and manage your account</p>
        </div>
      </div>

      {errorAlert && <div className="alert-banner error">{errorAlert}</div>}

      {/* Tabs */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Store size={16} />
            <span>Store Performance</span>
          </div>
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={16} />
            <span>Change Password</span>
          </div>
        </button>
      </div>

      {/* Perform dashboard */}
      {activeTab === 'dashboard' && dashboardData && (
        <>
          {!dashboardData.hasStore ? (
            <div className="section-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Store Associated</h2>
              <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                {dashboardData.message}
              </p>
            </div>
          ) : (
            <>
              {/* Store metadata and ratings overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Store Profile Card */}
                <div className="section-card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Store Information
                  </h3>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {dashboardData.store?.name}
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    {dashboardData.store?.address}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                    Contact Email: {dashboardData.store?.email}
                  </p>
                </div>

                {/* Score stats card */}
                <div className="section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Overall Rating
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                    <Star size={40} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
                      {dashboardData.averageRating}
                    </span>
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Based on {dashboardData.totalRatings} ratings submitted by users
                  </span>
                </div>
              </div>

              {/* Reviewers listing */}
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <Users size={18} />
                    <span>User Rating History</span>
                  </h2>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => handleSort('name')}>
                          User Name <ArrowUpDown size={14} className="sort-indicator" />
                        </th>
                        <th className="sortable" onClick={() => handleSort('email')}>
                          Email Address <ArrowUpDown size={14} className="sort-indicator" />
                        </th>
                        <th>User Address</th>
                        <th className="sortable" onClick={() => handleSort('rating')}>
                          Rating <ArrowUpDown size={14} className="sort-indicator" />
                        </th>
                        <th className="sortable" onClick={() => handleSort('date')}>
                          Submitted Date <ArrowUpDown size={14} className="sort-indicator" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                            No users have rated your store yet.
                          </td>
                        </tr>
                      ) : (
                        reviewersList.map((reviewer) => (
                          <tr key={reviewer.ratingId}>
                            <td style={{ fontWeight: 500 }}>{reviewer.user.name}</td>
                            <td>{reviewer.user.email}</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{reviewer.user.address}</td>
                            <td>
                              <div className="stars-display">
                                {[1, 2, 3, 4, 5].map((starVal) => (
                                  <Star
                                    key={starVal}
                                    size={14}
                                    fill={starVal <= reviewer.rating ? '#f59e0b' : 'none'}
                                    color="#f59e0b"
                                  />
                                ))}
                                <span style={{ marginLeft: '0.25rem', fontWeight: 600, color: '#f8fafc' }}>
                                  ({reviewer.rating})
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <Calendar size={12} />
                                <span>{new Date(reviewer.createdAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Profile Update */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '560px', boxShadow: 'none' }}>
            <h2 className="auth-title" style={{ fontSize: '1.5rem', textAlign: 'left', marginBottom: '0.25rem' }}>Change Account Password</h2>
            <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Update your password credentials here</p>

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
                <label htmlFor="owner-old-pass">Current Password</label>
                <input
                  id="owner-old-pass"
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner-new-pass">New Password</label>
                <input
                  id="owner-new-pass"
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
                <span className="validation-hint">
                  Must be 8-16 characters and contain at least one uppercase letter and one special character symbol
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="owner-confirm-pass">Confirm New Password</label>
                <input
                  id="owner-confirm-pass"
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changed Password'
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
