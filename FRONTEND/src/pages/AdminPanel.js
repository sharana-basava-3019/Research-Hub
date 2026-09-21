import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalCaution, setShowFinalCaution] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    institution: '',
    department: '',
    designation: 'Student',
    role: 'user'
  });
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    byDesignation: {}
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');

      if (response.data.status === 'success') {
        const userData = response.data.data.users;
        setUsers(userData);
        calculateStats(userData);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData) => {
    const stats = {
      total: userData.length,
      admins: userData.filter(u => u.role === 'admin').length,
      byDesignation: {}
    };

    userData.forEach(user => {
      stats.byDesignation[user.designation] = (stats.byDesignation[user.designation] || 0) + 1;
    });

    setStats(stats);
  };

  // Format date as Day-Month-Year (DD-MM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const confirmDelete = (user) => {
    const isSelf = currentUser && (
      currentUser._id === user._id || 
      currentUser.id === user._id || 
      (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase())
    );

    if (isSelf) {
      toast.warning('You cannot delete your own admin account');
      return;
    }

    setUserToDelete(user);
    setShowFinalCaution(false);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/users/${userToDelete._id}`);

      toast.success(`User ${userToDelete.firstName} ${userToDelete.lastName} deleted successfully`);
      setShowFinalCaution(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    const isSelf = currentUser && (
      currentUser._id === userId || 
      currentUser.id === userId
    );

    if (isSelf) {
      toast.warning('You cannot modify your own administrative role');
      return;
    }

    try {
      await api.put(
        `/users/${userId}`,
        { role: newRole }
      );

      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation: backend strictly requires firstName, lastName, email, password, and institution
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || !newUser.institution) {
      toast.error('Please fill in all required fields (First Name, Last Name, Email, Password, Institution)');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post(
        '/users',
        newUser
      );

      toast.success('User created successfully');
      setShowAddUser(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        institution: '',
        department: '',
        designation: 'Student',
        role: 'user'
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="ds-loading">
        <div className="ds-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Page Header */}
      <div className="ds-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="ds-page-title">
            <i className="bi bi-shield-check me-2" style={{ color: 'var(--color-accent, #4f46e5)' }}></i>
            Admin Panel
          </h1>
          <p className="ds-page-subtitle mb-0">Manage platform users, permissions, and administrative operations</p>
        </div>
        <button
          className={`btn ${showAddUser ? 'btn-outline-secondary' : 'btn-primary'}`}
          onClick={() => setShowAddUser(!showAddUser)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <i className={`bi bi-${showAddUser ? 'x-lg' : 'person-plus-fill'}`}></i>
          {showAddUser ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="ds-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ds-stat-value">{stats.total}</div>
              <div className="ds-stat-label">Total Users</div>
            </div>
            <div className="ds-stat-icon ds-icon-blue">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>
        </div>
        <div className="ds-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ds-stat-value">{stats.admins}</div>
              <div className="ds-stat-label">Admins</div>
            </div>
            <div className="ds-stat-icon ds-icon-green">
              <i className="bi bi-shield-fill-check"></i>
            </div>
          </div>
        </div>
        <div className="ds-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ds-stat-value">{stats.byDesignation['Professor'] || 0}</div>
              <div className="ds-stat-label">Professors</div>
            </div>
            <div className="ds-stat-icon ds-icon-info">
              <i className="bi bi-person-workspace"></i>
            </div>
          </div>
        </div>
        <div className="ds-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="ds-stat-value">{stats.byDesignation['Student'] || 0}</div>
              <div className="ds-stat-label">Students</div>
            </div>
            <div className="ds-stat-icon ds-icon-amber">
              <i className="bi bi-backpack-fill"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rh-tabs mb-4">
        <button
          className={`rh-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="bi bi-people me-2"></i>
          User Management ({users.length})
        </button>
        <button
          className={`rh-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-bar-chart-line me-2"></i>
          Platform Overview & Distribution
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div>
          {/* Search & Filter Bar */}
          <div className="rh-filter-bar mb-4">
            <div className="rh-search-bar">
              <i className="bi bi-search rh-search-icon"></i>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <button
              className={`btn ${showAddUser ? 'btn-outline-secondary' : 'btn-primary'}`}
              onClick={() => setShowAddUser(!showAddUser)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className={`bi bi-${showAddUser ? 'x-lg' : 'person-plus-fill'}`}></i>
              {showAddUser ? 'Close Form' : 'Add User'}
            </button>
          </div>

          {/* Add User Form Drawer / Card */}
          {showAddUser && (
            <div className="card card-static mb-4 shadow-sm" style={{ border: '1px solid var(--color-accent-mid, #6366f1)' }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'var(--color-accent-bg, #eef2ff)' }}>
                <span className="fw-semibold text-primary">
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Create New User
                </span>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddUser(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleAddUser}>
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: 'var(--font-label)', letterSpacing: '0.05em' }}>
                        <i className="bi bi-person-circle me-1"></i> Personal Information
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">First Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter first name"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter last name"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 mt-3">
                      <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: 'var(--font-label)', letterSpacing: '0.05em' }}>
                        <i className="bi bi-key me-1"></i> Account Credentials
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password <span className="text-danger">*</span></label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Minimum 6 characters"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        minLength="6"
                        required
                      />
                      <small className="text-muted"><i className="bi bi-info-circle me-1"></i>Must be at least 6 characters</small>
                    </div>

                    <div className="col-12 mt-3">
                      <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: 'var(--font-label)', letterSpacing: '0.05em' }}>
                        <i className="bi bi-building me-1"></i> Academic Information
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Institution <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter institution name (e.g. Stanford University)"
                        value={newUser.institution}
                        onChange={(e) => setNewUser({ ...newUser, institution: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter department (e.g. Computer Science)"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={newUser.designation}
                        onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                        required
                      >
                        <option value="Admin">Admin</option>
                        <option value="Professor">Professor</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Student">Student</option>
                        <option value="Guest">Guest</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">System Role <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        required
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddUser(false);
                        setNewUser({ firstName: '', lastName: '', email: '', password: '', institution: '', department: '', designation: 'Student', role: 'user' });
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-person-plus-fill me-2"></i>
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Table Card */}
          <div className="card card-static mb-4" style={{ overflow: 'hidden' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-people me-2"></i>
                User Management ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ width: '100%', minWidth: '850px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '22%', padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        NAME
                      </th>
                      <th style={{ width: '26%', padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        EMAIL
                      </th>
                      <th style={{ width: '16%', padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        DESIGNATION
                      </th>
                      <th style={{ width: '14%', padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        ROLE
                      </th>
                      <th style={{ width: '14%', padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        JOINED
                      </th>
                      <th style={{ width: '8%', padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-label)', letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-5">
                          <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                          No users found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelf = currentUser && (
                          currentUser._id === user._id || 
                          currentUser.id === user._id || 
                          (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase())
                        );

                        return (
                          <tr key={user._id}>
                            <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                              <div className="d-flex flex-column align-items-start">
                                <div className="d-flex align-items-center gap-2">
                                  <strong className="text-dark">{user.firstName} {user.lastName}</strong>
                                  {isSelf && (
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: 'var(--font-small)', padding: '2px 6px' }}>
                                      You
                                    </span>
                                  )}
                                </div>
                                {user.role === 'admin' && (
                                  <span className="badge bg-success mt-1" style={{ width: 'fit-content', fontSize: 'var(--font-small)' }}>
                                    <i className="bi bi-shield-check me-1"></i>
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left' }} className="text-muted">
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-envelope text-secondary"></i>
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                              <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2" style={{
                                display: 'inline-block',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                borderRadius: '6px'
                              }}>
                                {user.designation || 'Student'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                              <select
                                className="form-select form-select-sm"
                                value={user.role}
                                disabled={isSelf}
                                onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                                style={{ 
                                  width: 'auto', 
                                  minWidth: '95px', 
                                  cursor: isSelf ? 'not-allowed' : 'pointer',
                                  opacity: isSelf ? 0.7 : 1
                                }}
                                title={isSelf ? 'You cannot modify your own administrative role' : 'Change user role'}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'left' }} className="text-muted">
                              <div className="d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                                <i className="bi bi-calendar3 text-secondary"></i>
                                <span>{formatDate(user.createdAt)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => confirmDelete(user)}
                                disabled={isSelf}
                                title={isSelf ? 'You cannot delete your own account' : 'Delete User'}
                                style={{ 
                                  cursor: isSelf ? 'not-allowed' : 'pointer',
                                  opacity: isSelf ? 0.35 : 1
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Platform Overview & Distribution */}
      {activeTab === 'overview' && (
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card card-static h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
                  Users by Academic Designation
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {stats.total} Total
                </span>
              </div>
              <div className="card-body p-4">
                {['Professor', 'Student', 'Researcher', 'Admin', 'Guest'].map(desig => {
                  const count = stats.byDesignation[desig] || 0;
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const getBarColor = (d) => {
                    switch (d) {
                      case 'Professor': return 'bg-info';
                      case 'Student': return 'bg-warning';
                      case 'Researcher': return 'bg-primary';
                      case 'Admin': return 'bg-success';
                      default: return 'bg-secondary';
                    }
                  };
                  return (
                    <div key={desig} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>{desig}</span>
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>{count} users ({percent}%)</span>
                      </div>
                      <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-surface-2, #f1f5f9)' }}>
                        <div
                          className={`progress-bar ${getBarColor(desig)}`}
                          style={{ width: `${percent}%` }}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-static h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-clock-history me-2 text-primary"></i>
                  Recently Registered Users
                </span>
                <span className="badge bg-light text-secondary border">Latest 5</span>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {users.slice(0, 5).map(u => (
                    <div key={u._id} className="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                      <div>
                        <div className="fw-semibold text-dark">{u.firstName} {u.lastName}</div>
                        <div className="text-muted small">
                          <i className="bi bi-envelope me-1"></i>
                          {u.email}
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-info-subtle text-info border border-info-subtle">
                          {u.designation || 'Student'}
                        </span>
                        <small className="text-muted d-block mt-1">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(u.createdAt)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-footer bg-white border-top text-center py-2">
                <button
                  className="btn btn-link btn-sm text-decoration-none fw-semibold"
                  onClick={() => setActiveTab('users')}
                >
                  Manage all {users.length} users in User Management &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false);
              setShowFinalCaution(false);
              setUserToDelete(null);
            }
          }}
        >
          <div
            style={{ maxWidth: showFinalCaution ? '520px' : '460px', width: '100%', transition: 'all 0.2s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!showFinalCaution ? (
              /* Step 1: Initial Deletion Confirmation Modal */
              <div
                className="modal-content border-0 shadow-lg"
                style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--color-surface, #fff)' }}
              >
                {/* Header with Warning Icon & Close Button */}
                <div
                  className="d-flex align-items-center justify-content-between p-4 pb-3"
                  style={{ borderBottom: '1px solid var(--color-border, #f1f5f9)' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        border: '1px solid #fee2e2'
                      }}
                    >
                      <i className="bi bi-person-x-fill"></i>
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                        Delete User Request
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                        Step 1 of 2: Review Account Details
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Close Button */}
                  <button
                    type="button"
                    className="btn btn-sm btn-light border-0 rounded-circle"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    title="Close popup"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      backgroundColor: '#f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }}></i>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4 pt-3">
                  <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
                    You have requested to delete the following account:
                  </p>

                  {/* User Info Card */}
                  <div
                    style={{
                      background: 'var(--color-surface-2, #f8fafc)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      border: '1px solid var(--color-border, #e2e8f0)'
                    }}
                  >
                    <div className="mb-1">
                      <strong className="text-dark" style={{ fontSize: '0.975rem' }}>
                        {userToDelete?.firstName} {userToDelete?.lastName}
                      </strong>
                    </div>
                    <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-envelope text-secondary"></i>
                      <span>{userToDelete?.email}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                        <i className="bi bi-person-badge me-1"></i>
                        {userToDelete?.designation || 'Student'}
                      </span>
                      <span
                        className={`badge ${userToDelete?.role === 'admin' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} px-2.5 py-1`}
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className={`bi bi-${userToDelete?.role === 'admin' ? 'shield-check' : 'person'} me-1`}></i>
                        {userToDelete?.role === 'admin' ? 'Admin Role' : 'User Role'}
                      </span>
                    </div>
                  </div>

                  {/* Step Notice */}
                  <div
                    className="d-flex align-items-center gap-2 p-3 rounded-3"
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                      color: '#b45309',
                      fontSize: '0.85rem'
                    }}
                  >
                    <i className="bi bi-shield-exclamation fs-6 flex-shrink-0" style={{ color: '#d97706' }}></i>
                    <div>
                      Proceeding will prompt for a <strong>final caution confirmation</strong> before removing the account.
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div
                  className="d-flex align-items-center justify-content-end p-3 px-4"
                  style={{
                    background: 'var(--color-surface-2, #f8fafc)',
                    borderTop: '1px solid var(--color-border, #f1f5f9)',
                    gap: '12px'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 py-2"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    style={{ borderRadius: '8px', fontWeight: 500, fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-3 py-2"
                    onClick={() => setShowFinalCaution(true)}
                    style={{
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    <span>Proceed to Delete</span>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Secondary FINAL CAUTION Card Pop-Up */
              <div
                className="modal-content border-0 shadow-lg"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface, #fff)',
                  border: '1px solid #fecaca'
                }}
              >
                {/* Final Caution Header */}
                <div
                  className="d-flex align-items-start justify-content-between p-4 pb-3"
                  style={{
                    borderBottom: '1px solid #fee2e2',
                    background: 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.35rem',
                        flexShrink: 0,
                        border: '1px solid #fca5a5'
                      }}
                    >
                      <i className="bi bi-exclamation-octagon-fill"></i>
                    </div>
                    <div>
                      <h5
                        className="modal-title fw-bold text-dark mb-1"
                        style={{ fontSize: '1.08rem', lineHeight: '1.35' }}
                      >
                        Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}?
                      </h5>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge bg-danger text-white px-2 py-0.5"
                          style={{ fontSize: 'var(--font-label)', fontWeight: 700, letterSpacing: '0.04em' }}
                        >
                          FINAL CAUTION
                        </span>
                        <span className="text-danger fw-medium" style={{ fontSize: 'var(--font-small)', color: '#fca5a5' }}>
                          Irreversible Action
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Close Button */}
                  <button
                    type="button"
                    className="btn btn-sm btn-light border-0 rounded-circle flex-shrink-0"
                    onClick={() => {
                      setShowFinalCaution(false);
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    title="Close popup"
                    disabled={isDeleting}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      backgroundColor: '#f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }}></i>
                  </button>
                </div>

                {/* Final Caution Body with User Data */}
                <div className="modal-body p-4 pt-3">
                  {/* Structured User Data Card */}
                  <div
                    style={{
                      background: 'var(--color-surface-2, #f8fafc)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      border: '1px solid var(--color-border, #e2e8f0)'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        <i className="bi bi-person me-1"></i> User Name
                      </span>
                      <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                        {userToDelete?.firstName} {userToDelete?.lastName}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        <i className="bi bi-envelope me-1"></i> Email
                      </span>
                      <span className="text-secondary fw-semibold" style={{ fontSize: '0.85rem' }}>
                        {userToDelete?.email}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        <i className="bi bi-building me-1"></i> Institution & Dept
                      </span>
                      <span className="text-dark fw-medium text-end" style={{ fontSize: '0.82rem', maxWidth: '240px' }}>
                        {userToDelete?.institution || 'N/A'}{userToDelete?.department ? ` (${userToDelete.department})` : ''}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <span className="text-muted" style={{ fontSize: 'var(--font-small)', fontWeight: 500 }}>
                        <i className="bi bi-award me-1"></i> Designation
                      </span>
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-0.5" style={{ fontSize: 'var(--font-small)' }}>
                        {userToDelete?.designation || 'Student'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <span className="text-muted" style={{ fontSize: 'var(--font-small)', fontWeight: 500 }}>
                        <i className="bi bi-shield me-1"></i> System Role
                      </span>
                      <span
                        className={`badge ${userToDelete?.role === 'admin' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} px-2 py-0.5`}
                        style={{ fontSize: 'var(--font-small)' }}
                      >
                        {userToDelete?.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted" style={{ fontSize: 'var(--font-small)', fontWeight: 500 }}>
                        <i className="bi bi-calendar-event me-1"></i> Joined On
                      </span>
                      <span className="text-muted" style={{ fontSize: 'var(--font-small)' }}>
                        {formatDate(userToDelete?.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div
                    className="d-flex align-items-start gap-2 p-3 rounded-3"
                    style={{
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#9f1239',
                      fontSize: '0.83rem',
                      lineHeight: '1.45'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0" style={{ color: '#e11d48', marginTop: '1px' }}></i>
                    <div>
                      <strong>FINAL CAUTION:</strong> Deleting this account cannot be undone. All personal information, permissions, and affiliations will be permanently purged immediately.
                    </div>
                  </div>
                </div>

                {/* Modern Footer with Yes and No/Cancel Buttons (Properly Aligned and Spaced) */}
                <div
                  className="d-flex align-items-center justify-content-end p-3 px-4"
                  style={{
                    background: 'var(--color-surface-2, #f8fafc)',
                    borderTop: '1px solid var(--color-border, #f1f5f9)',
                    gap: '12px'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 py-2"
                    onClick={() => {
                      setShowFinalCaution(false);
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    disabled={isDeleting}
                    style={{ borderRadius: '8px', fontWeight: 500, fontSize: '0.875rem' }}
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-3 py-2"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                      backgroundColor: '#dc2626',
                      borderColor: '#dc2626'
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash-fill"></i>
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;