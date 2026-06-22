import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Store,
  Star,
  Plus,
  ArrowUpDown,
  X,
  UserCheck,
  Eye,
  AlertCircle
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
  breakdown: { role: string; count: number }[];
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  role: 'ADMIN' | 'USER' | 'OWNER';
}

interface StoreListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number;
  totalRatings: number;
}

export const AdminDashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  
  // Dashboard statistics
  const [stats, setStats] = useState<Stats | null>(null);

  // Tab state: 'users' | 'stores'
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users');

  // Listings data
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stores, setStores] = useState<StoreListItem[]>([]);

  // Filtering states (Users)
  const [userFilterName, setUserFilterName] = useState('');
  const [userFilterEmail, setUserFilterEmail] = useState('');
  const [userFilterAddress, setUserFilterAddress] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('');

  // Sorting states (Users)
  const [userSortField, setUserSortField] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtering states (Stores)
  const [storeFilterName, setStoreFilterName] = useState('');
  const [storeFilterEmail, setStoreFilterEmail] = useState('');
  const [storeFilterAddress, setStoreFilterAddress] = useState('');

  // Sorting states (Stores)
  const [storeSortField, setStoreSortField] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal display states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [viewUserDetails, setViewUserDetails] = useState<any | null>(null);

  // Create User form values
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'USER',
  });
  const [addUserErrors, setAddUserErrors] = useState<any>({});
  
  // Create Store form values
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: '',
  });
  const [addStoreErrors, setAddStoreErrors] = useState<any>({});
  const [availableOwners, setAvailableOwners] = useState<UserListItem[]>([]);

  // API Alerts
  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const data = await apiFetch('/admin/dashboard');
      setStats(data);
    } catch (e: any) {
      console.error(e);
      setErrorAlert('Failed to load dashboard metrics');
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userFilterName) params.append('name', userFilterName);
      if (userFilterEmail) params.append('email', userFilterEmail);
      if (userFilterAddress) params.append('address', userFilterAddress);
      if (userFilterRole) params.append('role', userFilterRole);
      params.append('sortField', userSortField);
      params.append('sortOrder', userSortOrder);

      const data = await apiFetch(`/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch (e: any) {
      console.error(e);
      setErrorAlert('Failed to load users');
    }
  };

  // Fetch Stores
  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (storeFilterName) params.append('name', storeFilterName);
      if (storeFilterEmail) params.append('email', storeFilterEmail);
      if (storeFilterAddress) params.append('address', storeFilterAddress);
      params.append('sortField', storeSortField);
      params.append('sortOrder', storeSortOrder);

      const data = await apiFetch(`/admin/stores?${params.toString()}`);
      setStores(data.stores);
    } catch (e: any) {
      console.error(e);
      setErrorAlert('Failed to load stores');
    }
  };

  // Fetch available owners (OWNER role who don't have stores)
  const fetchAvailableOwners = async () => {
    try {
      // Get all owners first
      const data = await apiFetch('/admin/users?role=OWNER');
      
      // Filter out owners that already manage a store by checking if they appear in our store listings
      // (or let the backend throw errors if assigned, but we can display the ones who aren't in current stores owners)
      // Actually we'll fetch stores to know who is already assigned.
      const storesData = await apiFetch('/admin/stores');
      const assignedOwnerIds = storesData.stores
        .map((s: any) => s.owner?.id)
        .filter(Boolean);

      const unassigned = data.users.filter((u: any) => !assignedOwnerIds.includes(u.id));
      setAvailableOwners(unassigned);
    } catch (e: any) {
      console.error('Failed to load unassigned owners', e);
    }
  };

  // Load stats and list on init
  useEffect(() => {
    fetchStats();
  }, []);

  // Reload lists when filters or sorts change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStores();
    }
  }, [
    activeTab,
    userFilterName, userFilterEmail, userFilterAddress, userFilterRole, userSortField, userSortOrder,
    storeFilterName, storeFilterEmail, storeFilterAddress, storeSortField, storeSortOrder
  ]);

  // Handle Sort Change (Users)
  const handleUserSort = (field: string) => {
    if (userSortField === field) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
  };

  // Handle Sort Change (Stores)
  const handleStoreSort = (field: string) => {
    if (storeSortField === field) {
      setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoreSortField(field);
      setStoreSortOrder('asc');
    }
  };

  // Handle click on User Details
  const handleViewUser = async (userId: string) => {
    try {
      const data = await apiFetch(`/admin/users/${userId}`);
      setViewUserDetails(data);
    } catch (e: any) {
      setErrorAlert('Failed to load user details');
    }
  };

  // Form Field Validation helpers
  const validateUserForm = () => {
    const errs: any = {};
    
    // Name validation: 20-60 characters
    if (!newUser.name) {
      errs.name = 'Name is required';
    } else if (newUser.name.length < 20 || newUser.name.length > 60) {
      errs.name = 'Name must be between 20 and 60 characters';
    }

    // Email validation
    if (!newUser.email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errs.email = 'Invalid email format';
    }

    // Password validation: 8-16 chars, 1 uppercase, 1 special symbol
    if (!newUser.password) {
      errs.password = 'Password is required';
    } else if (newUser.password.length < 8 || newUser.password.length > 16) {
      errs.password = 'Password must be between 8 and 16 characters';
    } else {
      const hasUpper = /[A-Z]/.test(newUser.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newUser.password);
      if (!hasUpper) errs.password = 'Must include at least one uppercase letter';
      else if (!hasSpecial) errs.password = 'Must include at least one special character';
    }

    // Address validation: Max 400 characters
    if (!newUser.address) {
      errs.address = 'Address is required';
    } else if (newUser.address.length > 400) {
      errs.address = 'Address cannot exceed 400 characters';
    }

    setAddUserErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStoreForm = () => {
    const errs: any = {};

    // Name validation: 20-60 characters
    if (!newStore.name) {
      errs.name = 'Store name is required';
    } else if (newStore.name.length < 20 || newStore.name.length > 60) {
      errs.name = 'Store name must be between 20 and 60 characters';
    }

    // Email validation
    if (!newStore.email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStore.email)) {
      errs.email = 'Invalid email format';
    }

    // Address validation: Max 400 characters
    if (!newStore.address) {
      errs.address = 'Address is required';
    } else if (newStore.address.length > 400) {
      errs.address = 'Address cannot exceed 400 characters';
    }

    setAddStoreErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });

      setSuccessAlert('User added successfully!');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', address: '', role: 'USER' });
      setAddUserErrors({});
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setAddUserErrors({ api: err.message || 'Failed to create user' });
    }
  };

  // Submit Store
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStoreForm()) return;

    try {
      await apiFetch('/admin/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: newStore.name,
          email: newStore.email,
          address: newStore.address,
          ownerId: newStore.ownerId || null,
        }),
      });

      setSuccessAlert('Store created successfully!');
      setShowAddStoreModal(false);
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      setAddStoreErrors({});
      fetchStores();
      fetchStats();
    } catch (err: any) {
      setAddStoreErrors({ api: err.message || 'Failed to create store' });
    }
  };

  // Show store owners when store modal opens
  const openStoreModal = () => {
    fetchAvailableOwners();
    setShowAddStoreModal(true);
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
          <h1>Admin Command Center</h1>
          <p>Register users, build store outlets, and audit system ratings</p>
        </div>
      </div>

      {/* Alert banners */}
      {successAlert && <div className="alert-banner success">{successAlert}</div>}
      {errorAlert && <div className="alert-banner error">{errorAlert}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats ? stats.totalUsers : '--'}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stores">
            <Store size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats ? stats.totalStores : '--'}</span>
            <span className="stat-label">Total Stores</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon ratings">
            <Star size={24} fill="#a855f7" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats ? stats.totalRatings : '--'}</span>
            <span className="stat-label">Total Ratings</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Add Actions */}
      <div className="section-card">
        <div className="section-header">
          <div className="tabs-navigation" style={{ marginBottom: 0 }}>
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users Directory
            </button>
            <button
              className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
              onClick={() => setActiveTab('stores')}
            >
              Stores Index
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeTab === 'users' ? (
              <button className="btn-primary" onClick={() => setShowAddUserModal(true)} style={{ width: 'auto', padding: '0.55rem 1rem' }}>
                <Plus size={18} />
                <span>Add User</span>
              </button>
            ) : (
              <button className="btn-primary" onClick={openStoreModal} style={{ width: 'auto', padding: '0.55rem 1rem' }}>
                <Plus size={18} />
                <span>Add Store</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <>
            {/* User Filters */}
            <div className="filters-bar">
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Name"
                  value={userFilterName}
                  onChange={(e) => setUserFilterName(e.target.value)}
                />
              </div>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Email"
                  value={userFilterEmail}
                  onChange={(e) => setUserFilterEmail(e.target.value)}
                />
              </div>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Address"
                  value={userFilterAddress}
                  onChange={(e) => setUserFilterAddress(e.target.value)}
                />
              </div>
              <div className="filter-input-wrapper">
                <select
                  className="filter-control filter-select"
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="USER">Normal User</option>
                  <option value="OWNER">Store Owner</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleUserSort('name')}>
                      Name <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleUserSort('email')}>
                      Email <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleUserSort('address')}>
                      Address <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleUserSort('role')}>
                      Role <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.address}
                        </td>
                        <td>
                          <span className={`role-tag ${u.role.toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td>
                          <button className="table-action-btn" onClick={() => handleViewUser(u.id)}>
                            <Eye size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 2: Stores */}
        {activeTab === 'stores' && (
          <>
            {/* Store Filters */}
            <div className="filters-bar">
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Store Name"
                  value={storeFilterName}
                  onChange={(e) => setStoreFilterName(e.target.value)}
                />
              </div>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Email"
                  value={storeFilterEmail}
                  onChange={(e) => setStoreFilterEmail(e.target.value)}
                />
              </div>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Filter by Address"
                  value={storeFilterAddress}
                  onChange={(e) => setStoreFilterAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Stores Table */}
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleStoreSort('name')}>
                      Store Name <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleStoreSort('email')}>
                      Email <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleStoreSort('address')}>
                      Address <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                    <th className="sortable" onClick={() => handleStoreSort('averageRating')}>
                      Rating <ArrowUpDown size={14} className="sort-indicator" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        No stores registered.
                      </td>
                    </tr>
                  ) : (
                    stores.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.address}</td>
                        <td>
                          <div className="stars-display">
                            <Star size={14} fill={s.averageRating > 0 ? '#f59e0b' : 'none'} color="#f59e0b" />
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                              {s.averageRating > 0 ? s.averageRating : 'Unrated'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              ({s.totalRatings} ratings)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal 1: Add User */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New User</h3>
              <button className="btn-close-modal" onClick={() => setShowAddUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                {addUserErrors.api && (
                  <div className="alert-banner error" style={{ padding: '0.5rem 0.75rem' }}>
                    <AlertCircle size={16} />
                    <span>{addUserErrors.api}</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="modal-user-name">Full Name</label>
                  <input
                    id="modal-user-name"
                    type="text"
                    className={`form-control ${addUserErrors.name ? 'error' : ''}`}
                    placeholder="Min 20, Max 60 characters"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                  {addUserErrors.name && <span className="error-text">{addUserErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-user-email">Email Address</label>
                  <input
                    id="modal-user-email"
                    type="email"
                    className={`form-control ${addUserErrors.email ? 'error' : ''}`}
                    placeholder="e.g. user@rateflow.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  {addUserErrors.email && <span className="error-text">{addUserErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-user-password">Temp Password</label>
                  <input
                    id="modal-user-password"
                    type="password"
                    className={`form-control ${addUserErrors.password ? 'error' : ''}`}
                    placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  {addUserErrors.password && <span className="error-text">{addUserErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-user-address">Physical Address</label>
                  <textarea
                    id="modal-user-address"
                    className={`form-control ${addUserErrors.address ? 'error' : ''}`}
                    placeholder="Max 400 characters"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    rows={2}
                  />
                  {addUserErrors.address && <span className="error-text">{addUserErrors.address}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-user-role">Assigned System Role</label>
                  <select
                    id="modal-user-role"
                    className="form-control filter-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="USER">Normal User</option>
                    <option value="OWNER">Store Owner</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Store */}
      {showAddStoreModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Store</h3>
              <button className="btn-close-modal" onClick={() => setShowAddStoreModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStore}>
              <div className="modal-body">
                {addStoreErrors.api && (
                  <div className="alert-banner error" style={{ padding: '0.5rem 0.75rem' }}>
                    <AlertCircle size={16} />
                    <span>{addStoreErrors.api}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="modal-store-name">Store Name</label>
                  <input
                    id="modal-store-name"
                    type="text"
                    className={`form-control ${addStoreErrors.name ? 'error' : ''}`}
                    placeholder="Min 20, Max 60 characters"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  />
                  {addStoreErrors.name && <span className="error-text">{addStoreErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-store-email">Contact Email</label>
                  <input
                    id="modal-store-email"
                    type="email"
                    className={`form-control ${addStoreErrors.email ? 'error' : ''}`}
                    placeholder="e.g. coffee@cafe.com"
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  />
                  {addStoreErrors.email && <span className="error-text">{addStoreErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-store-address">Location Address</label>
                  <textarea
                    id="modal-store-address"
                    className={`form-control ${addStoreErrors.address ? 'error' : ''}`}
                    placeholder="Max 400 characters"
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    rows={2}
                  />
                  {addStoreErrors.address && <span className="error-text">{addStoreErrors.address}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-store-owner">Assign Owner (Optional)</label>
                  <select
                    id="modal-store-owner"
                    className="form-control filter-select"
                    value={newStore.ownerId}
                    onChange={(e) => setNewStore({ ...newStore, ownerId: e.target.value })}
                  >
                    <option value="">-- No Owner Assigned --</option>
                    {availableOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddStoreModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View User Details */}
      {viewUserDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--color-primary)" />
                <span>User Summary Profile</span>
              </h3>
              <button className="btn-close-modal" onClick={() => setViewUserDetails(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{viewUserDetails.user.name}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{viewUserDetails.user.email}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{viewUserDetails.user.address}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Assigned Role</span>
                  <span className="detail-value">
                    <span className={`role-tag ${viewUserDetails.user.role.toLowerCase()}`}>
                      {viewUserDetails.user.role}
                    </span>
                  </span>
                </div>

                {viewUserDetails.user.role === 'OWNER' && (
                  <div className="detail-row" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <span className="detail-label" style={{ color: 'var(--color-warning)' }}>Managed Outlet Info</span>
                    {viewUserDetails.store ? (
                      <>
                        <span className="detail-value" style={{ fontWeight: 600 }}>{viewUserDetails.store.name}</span>
                        <span className="detail-value" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                          {viewUserDetails.store.address}
                        </span>
                        <div className="detail-value rating-glow" style={{ marginTop: '0.5rem' }}>
                          <Star size={20} fill="#f59e0b" color="#f59e0b" />
                          <span>{viewUserDetails.averageRating > 0 ? viewUserDetails.averageRating : 'No Ratings Yet'}</span>
                        </div>
                      </>
                    ) : (
                      <span className="detail-value" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                        No store assigned yet
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setViewUserDetails(null)}>
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
