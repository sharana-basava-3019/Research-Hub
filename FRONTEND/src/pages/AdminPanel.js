import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    fetchEventRegistrations();
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

  const fetchEventRegistrations = async () => {
    try {
      const response = await api.get('/events/admin/registrations');

      if (response.data.status === 'success') {
        setEventRegistrations(response.data.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch event registrations:', error);
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

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete._id}`);

      toast.success('User deleted successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
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
    
    // Validation
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post(
        '/auth/register',
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
      <div className="container section">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h1 className="mb-0">
            <i className="bi bi-shield-check me-2"></i>
            Admin Panel
          </h1>
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <span className="badge bg-primary px-4 py-2" style={{ fontSize: '1rem' }}>
              <i className="bi bi-people-fill me-2"></i>
              Total Users: {stats.total}
            </span>
            <span className="badge bg-success px-4 py-2" style={{ fontSize: '1rem' }}>
              <i className="bi bi-calendar-check me-2"></i>
              Events: {eventRegistrations.length}
            </span>
            <span className="badge bg-info px-4 py-2" style={{ fontSize: '1rem' }}>
              <i className="bi bi-person-check me-2"></i>
              Total Registrations: {eventRegistrations.reduce((sum, event) => sum + event.registrationCount, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-2"></i>
            User Management
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <i className="bi bi-calendar-event me-2"></i>
            Event Registrations
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div>
      {/* Statistics Summary */}
      <div className="row mb-4">
        <div className="col-12 d-flex gap-3 align-items-center flex-wrap">
          <span className="badge bg-success px-4 py-2" style={{ fontSize: '1rem' }}>
            <i className="bi bi-shield-fill-check me-2"></i>
            Admins: {stats.admins}
          </span>
          <span className="badge bg-info px-4 py-2" style={{ fontSize: '1rem' }}>
            <i className="bi bi-person-workspace me-2"></i>
            Professors: {stats.byDesignation['Professor'] || 0}
          </span>
          <span className="badge bg-warning text-dark px-4 py-2" style={{ fontSize: '1rem' }}>
            <i className="bi bi-backpack-fill me-2"></i>
            Students: {stats.byDesignation['Student'] || 0}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-auto">
              <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-search me-2"></i>
                Search
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem', padding: '0.5rem 0.75rem', width: '288px' }}
              />
            </div>
            <div className="col-auto">
              <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-shield me-2"></i>
                Filter by Role
              </label>
              <select
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{ fontSize: '0.95rem', padding: '0.5rem 0.75rem', width: '180px' }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-4">
            <i className="bi bi-people me-2"></i>
            User Management ({filteredUsers.length} users)
          </h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ width: '100%', tableLayout: 'fixed' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '18%' }} className="px-3">Name</th>
                  <th style={{ width: '22%' }} className="px-3">Email</th>
                  <th style={{ width: '15%' }} className="text-center px-3">Designation</th>
                  <th style={{ width: '15%' }} className="text-center px-3">Role</th>
                  <th style={{ width: '15%' }} className="text-center px-3">Joined</th>
                  <th style={{ width: '15%' }} className="text-center px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="d-flex flex-column">
                          <strong className="text-dark">{user.firstName} {user.lastName}</strong>
                          {user.role === 'admin' && (
                            <span className="badge bg-success mt-1" style={{ width: 'fit-content' }}>
                              <i className="bi bi-shield-check me-1"></i>
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted">
                        <i className="bi bi-envelope me-1"></i>
                        {user.email}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-info text-white px-3 py-2" style={{
                          minWidth: '120px',
                          display: 'inline-block',
                          textAlign: 'center'
                        }}>
                          {user.designation}
                        </span>
                      </td>
                      <td className="text-center">
                        <select
                          className="form-select form-select-sm text-center"
                          value={user.role}
                          onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                          style={{ minWidth: '100px' }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="text-center text-muted">
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => confirmDelete(user)}
                          title="Delete User"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New User Panel - Separate Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm" style={{ 
            border: '2px solid #dee2e6',
            borderRadius: '0.375rem'
          }}>
            <div className="card-body text-center py-4">
              <h5 className="mb-3" style={{ color: '#28a745', fontWeight: '600' }}>
                <i className="bi bi-person-plus-fill me-2"></i>
                Create New User Account
              </h5>
              <p className="text-muted mb-3">
                Add a new user to the RESEARCH-HUB platform
              </p>
              <button
                className="btn btn-success btn-lg px-5"
                onClick={() => setShowAddUser(!showAddUser)}
                style={{ 
                  borderRadius: '8px',
                  padding: '12px 40px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                  border: '2px solid #28a745',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                }}
              >
                <i className={`bi bi-${showAddUser ? 'x-circle' : 'person-plus-fill'} me-2`} style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  margin: '0'
                }}></i>
                {showAddUser ? 'Cancel' : 'Add New User'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.7)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '420px',
              width: '90%',
              margin: '0 auto'
            }}
          >
            <div className="modal-content" style={{ 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: '12px',
              border: 'none',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255,255,255,0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  color: 'white',
                  fontSize: '18px',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.5)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              >
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Compact Header */}
              <div className="modal-header" style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                border: 'none',
                padding: '16px 20px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <h5 className="modal-title mb-0" style={{ 
                    fontSize: '1.15rem',
                    fontWeight: '700'
                  }}>
                    Confirm Deletion
                  </h5>
                </div>
              </div>

              {/* Compact Body */}
              <div className="modal-body" style={{ 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <p style={{ 
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  Delete this user permanently?
                </p>

                {/* Compact User Info */}
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '14px',
                  border: '1px solid #e1e4e8'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '2px' }}>User</div>
                    <div style={{ fontSize: '0.9rem', color: '#212529', fontWeight: '600' }}>
                      {userToDelete?.firstName} {userToDelete?.lastName}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '2px' }}>Email</div>
                    <div style={{ fontSize: '0.85rem', color: '#212529', fontWeight: '500' }}>
                      {userToDelete?.email}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '2px' }}>Designation</div>
                    <div style={{ fontSize: '0.85rem', color: '#212529', fontWeight: '500' }}>
                      {userToDelete?.designation}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '2px' }}>Role</div>
                    <div style={{ fontSize: '0.85rem', color: '#212529', fontWeight: '500', textTransform: 'capitalize' }}>
                      {userToDelete?.role}
                    </div>
                  </div>
                </div>

                {/* Compact Warning */}
                <div style={{ 
                  backgroundColor: '#fff3cd',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #ffc107'
                }}>
                  <i className="bi bi-exclamation-circle-fill" style={{ 
                    fontSize: '16px',
                    color: '#856404',
                    flexShrink: 0
                  }}></i>
                  <span style={{ color: '#856404', fontSize: '0.8rem', fontWeight: '500' }}>
                    This action cannot be undone!
                  </span>
                </div>
              </div>

              {/* Compact Footer */}
              <div className="modal-footer" style={{ 
                backgroundColor: '#f8f9fa',
                border: 'none',
                padding: '12px 16px',
                gap: '16px',
                justifyContent: 'flex-end',
                display: 'flex'
              }}>
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ 
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    border: '1px solid #dee2e6'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleDelete}
                  style={{ 
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-trash-fill me-1"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Form - Inline Section */}
      {showAddUser && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm" style={{ 
              border: '2px solid #dee2e6',
              borderRadius: '0.375rem'
            }}>
              <div className="card-header" style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                padding: '20px 24px',
                color: 'white'
              }}>
                <h5 className="mb-0" style={{ fontWeight: '700', fontSize: '1.3rem' }}>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Add New User
                </h5>
              </div>
              <div className="card-body p-4" style={{ backgroundColor: '#ffffff' }}>
                <form onSubmit={handleAddUser}>
                  <div className="row g-4">
                    {/* Personal Information Section */}
                    <div className="col-12">
                      <h6 className="mb-3" style={{ color: '#28a745', fontWeight: '600', fontSize: '1rem' }}>
                        <i className="bi bi-person-circle me-2"></i>
                        Personal Information
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-person me-1" style={{ color: '#28a745' }}></i>
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter first name"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-person me-1" style={{ color: '#28a745' }}></i>
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter last name"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                    </div>
                    
                    {/* Account Information Section */}
                    <div className="col-12 mt-4">
                      <h6 className="mb-3" style={{ color: '#28a745', fontWeight: '600', fontSize: '1rem' }}>
                        <i className="bi bi-key me-2"></i>
                        Account Credentials
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-envelope me-1" style={{ color: '#28a745' }}></i>
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-lock me-1" style={{ color: '#28a745' }}></i>
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Minimum 6 characters"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        minLength="6"
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                      <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                        <i className="bi bi-info-circle me-1"></i>
                        Must be at least 6 characters long
                      </small>
                    </div>
                    
                    {/* Academic Information Section */}
                    <div className="col-12 mt-4">
                      <h6 className="mb-3" style={{ color: '#28a745', fontWeight: '600', fontSize: '1rem' }}>
                        <i className="bi bi-building me-2"></i>
                        Academic Information
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-bank me-1" style={{ color: '#28a745' }}></i>
                        Institution
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter institution name"
                        value={newUser.institution}
                        onChange={(e) => setNewUser({ ...newUser, institution: e.target.value })}
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-diagram-3 me-1" style={{ color: '#28a745' }}></i>
                        Department
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter department"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-person-badge me-1" style={{ color: '#28a745' }}></i>
                        Designation <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={newUser.designation}
                        onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          color: '#495057',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Professor">Professor</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Student">Student</option>
                        <option value="Guest">Guest</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-shield-check me-1" style={{ color: '#28a745' }}></i>
                        System Role <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          color: '#495057',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="d-flex justify-content-end mt-4 pt-3" style={{ 
                    borderTop: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    margin: '24px -24px -24px -24px',
                    padding: '16px 24px',
                    gap: '80px'
                  }}>
                    <button
                      type="button"
                      className="btn btn-lg"
                      onClick={() => {
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
                      }}
                      style={{ 
                        borderRadius: '8px',
                        padding: '10px 24px',
                        border: '1px solid #dee2e6',
                        backgroundColor: '#ffffff',
                        color: '#495057',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8f9fa';
                        e.target.style.borderColor = '#adb5bd';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#dee2e6';
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        color: 'white',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                      }}
                    >
                      <i className="bi bi-person-plus-fill me-2"></i>
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Event Registrations Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title mb-4">
                <i className="bi bi-calendar-event me-2"></i>
                Event Registrations Overview
              </h5>
              
              {eventRegistrations.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                  <p className="text-muted">No events with registrations found</p>
                </div>
              ) : (
                eventRegistrations.map(event => (
                  <div key={event._id} className="card mb-3 border">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            <i className="bi bi-calendar-event me-2 text-primary"></i>
                            {event.title}
                          </h6>
                          <div className="d-flex gap-2 flex-wrap">
                            <span className={`badge ${event.category === 'Workshop' ? 'bg-success' : event.category === 'Conference' ? 'bg-info' : 'bg-danger'}`}>
                              {event.category}
                            </span>
                            <span className={`badge ${event.status === 'Published' ? 'bg-success' : 'bg-secondary'}`}>
                              {event.status}
                            </span>
                            <span className="text-muted small">
                              <i className="bi bi-calendar me-1"></i>
                              {new Date(event.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fs-5 fw-bold text-primary">
                            {event.registrationCount}
                            {event.capacity && ` / ${event.capacity}`}
                          </div>
                          <small className="text-muted">Registrations</small>
                        </div>
                      </div>
                    </div>
                    
                    {event.registrations && event.registrations.length > 0 && (
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-sm table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Participant</th>
                                <th>Email</th>
                                <th>Institution</th>
                                <th>Registered On</th>
                                <th className="text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {event.registrations.map((reg, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <i className="bi bi-person-circle me-2 text-primary"></i>
                                    <strong>{reg.user?.firstName} {reg.user?.lastName}</strong>
                                  </td>
                                  <td className="text-muted">
                                    <i className="bi bi-envelope me-1"></i>
                                    {reg.user?.email}
                                  </td>
                                  <td>{reg.user?.institution || 'N/A'}</td>
                                  <td>
                                    <i className="bi bi-clock me-1"></i>
                                    {new Date(reg.registeredAt).toLocaleDateString()}
                                  </td>
                                  <td className="text-center">
                                    <span className={`badge ${
                                      reg.status === 'Confirmed' ? 'bg-success' :
                                      reg.status === 'Waitlist' ? 'bg-warning' :
                                      'bg-secondary'
                                    }`}>
                                      {reg.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;