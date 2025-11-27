import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Collaborations = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // received, sent, all
  const [filterStatus, setFilterStatus] = useState(''); // Pending, Accepted, Rejected
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // pending, accepted, rejected, total
  const [modalData, setModalData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCollaborations();
    }
  }, [activeTab, filterStatus, user]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }

      const response = await api.get('/collaborations', { params });
      setCollaborations(response.data.data.collaborations || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      toast.error('Failed to load collaborations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/collaborations/${id}/accept`);
      toast.success('Collaboration request accepted!');
      fetchCollaborations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept collaboration');
    }
  };

  const handleReject = async (id, message = 'Thank you for your interest') => {
    try {
      await api.put(`/collaborations/${id}/reject`, { message });
      toast.success('Collaboration request rejected');
      fetchCollaborations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject collaboration');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this collaboration request?')) {
      return;
    }
    
    try {
      await api.delete(`/collaborations/${id}`);
      toast.success('Collaboration request cancelled');
      fetchCollaborations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel collaboration');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Pending': 'bg-warning',
      'Accepted': 'bg-success',
      'Rejected': 'bg-danger',
      'Cancelled': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatClick = (type) => {
    let filteredData = [];
    let title = '';

    switch(type) {
      case 'pending':
        filteredData = collaborations.filter(c => c.status === 'Pending');
        title = 'Pending Requests';
        break;
      case 'accepted':
        filteredData = collaborations.filter(c => c.status === 'Accepted');
        title = 'Accepted Collaborations';
        break;
      case 'rejected':
        filteredData = collaborations.filter(c => c.status === 'Rejected');
        title = 'Rejected Requests';
        break;
      case 'total':
        filteredData = collaborations;
        title = 'All Collaborations';
        break;
      default:
        filteredData = [];
    }

    setModalType(title);
    setModalData(filteredData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData([]);
    setModalType('');
  };

  if (!user) {
    return (
      <div className="container section text-center">
        <i className="bi bi-lock display-1 text-warning"></i>
        <h3 className="mt-3">Authentication Required</h3>
        <p className="text-muted">Please log in to view collaborations.</p>
        <Link to="/login" className="btn btn-primary mt-3">Login</Link>
      </div>
    );
  }

  const filteredCollaborations = collaborations;

  return (
    <div className="container section">
      {/* Modal for showing collaboration list */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">{modalType}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-0">
                {modalData.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No collaborations found</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {modalData.map((collab) => (
                      <div key={collab._id} className="list-group-item list-group-item-action">
                        <div className="d-flex align-items-center">
                          {/* Avatar */}
                          <div className="me-3">
                            {collab.sender?.profilePicture ? (
                              <img
                                src={collab.sender.profilePicture}
                                alt={`${collab.sender.firstName} ${collab.sender.lastName}`}
                                className="rounded-circle"
                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                style={{ width: '48px', height: '48px', fontSize: '18px' }}
                              >
                                {collab.sender?.firstName?.[0]}{collab.sender?.lastName?.[0]}
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-grow-1">
                            <div className="fw-semibold">
                              {collab.sender?.firstName} {collab.sender?.lastName}
                            </div>
                            <small className="text-muted d-block">
                              {collab.project?.title}
                            </small>
                            <small className="text-muted">
                              {collab.proposedRole} • {formatDate(collab.createdAt)}
                            </small>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`badge ${getStatusBadgeClass(collab.status)}`}>
                              {collab.status}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {collab.status === 'Pending' && activeTab === 'received' && (
                          <div className="mt-2 d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success flex-grow-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(collab._id);
                                closeModal();
                              }}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-sm btn-danger flex-grow-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(collab._id);
                                closeModal();
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="display-5 fw-bold mb-2">Collaborations</h1>
              <p className="text-muted mb-0">Manage your collaboration requests and connections</p>
            </div>
            <button
              className="btn btn-primary w-100 w-md-auto"
              onClick={() => navigate('/send-collaboration-request')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'received' ? 'active' : ''}`}
                onClick={() => setActiveTab('received')}
              >
                <i className="bi bi-inbox me-2"></i>
                Received
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'sent' ? 'active' : ''}`}
                onClick={() => setActiveTab('sent')}
              >
                <i className="bi bi-send me-2"></i>
                Sent
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <i className="bi bi-list me-2"></i>
                All
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Summary - Small Capsules */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <div 
          className="badge rounded-pill bg-primary text-white px-3 py-2 d-inline-flex align-items-center gap-2"
          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={() => handleStatClick('pending')}
          role="button"
        >
          <span className="fw-bold">{collaborations.filter(c => c.status === 'Pending').length}</span>
          <span>Pending</span>
        </div>
        
        <div 
          className="badge rounded-pill bg-success text-white px-3 py-2 d-inline-flex align-items-center gap-2"
          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={() => handleStatClick('accepted')}
          role="button"
        >
          <span className="fw-bold">{collaborations.filter(c => c.status === 'Accepted').length}</span>
          <span>Accepted</span>
        </div>
        
        <div 
          className="badge rounded-pill bg-danger text-white px-3 py-2 d-inline-flex align-items-center gap-2"
          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={() => handleStatClick('rejected')}
          role="button"
        >
          <span className="fw-bold">{collaborations.filter(c => c.status === 'Rejected').length}</span>
          <span>Rejected</span>
        </div>
        
        <div 
          className="badge rounded-pill bg-info text-white px-3 py-2 d-inline-flex align-items-center gap-2"
          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={() => handleStatClick('total')}
          role="button"
        >
          <span className="fw-bold">{collaborations.length}</span>
          <span>Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Collaboration List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredCollaborations.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h4 className="mt-3">No collaborations found</h4>
          <p className="text-muted">
            {activeTab === 'received' && 'You haven\'t received any collaboration requests yet.'}
            {activeTab === 'sent' && 'You haven\'t sent any collaboration requests yet.'}
            {activeTab === 'all' && 'No collaboration requests found.'}
          </p>
          <Link to="/projects" className="btn btn-primary mt-3">
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="row">
          {filteredCollaborations.map((collab) => (
            <div key={collab._id} className="col-12 mb-4">
              <div className="card shadow-sm hover-lift">
                <div className="card-body">
                  <div className="row g-3">
                    {/* User Info */}
                    <div className="col-12 col-md-4 col-lg-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {collab.sender?.profilePicture ? (
                            <img
                              src={collab.sender.profilePicture}
                              alt={`${collab.sender.firstName} ${collab.sender.lastName}`}
                              className="rounded-circle"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '50px', height: '50px', fontSize: '20px' }}
                            >
                              {collab.sender?.firstName?.[0]}{collab.sender?.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">
                            {collab.sender?.firstName} {collab.sender?.lastName}
                          </h6>
                          <small className="text-muted d-block">
                            {collab.sender?.institution}
                          </small>
                          <span className={`badge ${getStatusBadgeClass(collab.status)} mt-1`}>
                            {collab.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Collaboration Details */}
                    <div className="col-12 col-md-8 col-lg-6">
                      <div className="mb-2">
                        <strong className="text-muted small">Project:</strong>
                        <Link
                          to={`/projects/${collab.project?._id}`}
                          className="text-decoration-none d-block d-md-inline ms-0 ms-md-2"
                        >
                          {collab.project?.title}
                        </Link>
                      </div>
                      <div className="mb-2">
                        <strong className="text-muted small">Role:</strong>
                        <span className="d-block d-md-inline ms-0 ms-md-2">{collab.proposedRole}</span>
                      </div>
                      <div className="mb-2">
                        <strong className="text-muted small">Message:</strong>
                        <p className="mb-0 mt-1 text-muted small">"{collab.message}"</p>
                      </div>
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {formatDate(collab.createdAt)}
                      </small>
                    </div>

                    {/* Actions */}
                    <div className="col-12 col-lg-3">
                      <div className="d-flex d-lg-grid gap-2">
                        {activeTab === 'received' && collab.status === 'Pending' && (
                          <>
                            <button
                              className="btn btn-success btn-sm flex-grow-1"
                              onClick={() => handleAccept(collab._id)}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              <span className="d-none d-sm-inline">Accept</span>
                              <span className="d-sm-none">✓</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm flex-grow-1"
                              onClick={() => handleReject(collab._id)}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              <span className="d-none d-sm-inline">Reject</span>
                              <span className="d-sm-none">✗</span>
                            </button>
                          </>
                        )}
                        {activeTab === 'sent' && collab.status === 'Pending' && (
                          <button
                            className="btn btn-outline-secondary btn-sm w-100"
                            onClick={() => handleCancel(collab._id)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Cancel
                          </button>
                        )}
                        {collab.status === 'Accepted' && (
                          <Link
                            to={`/projects/${collab.project?._id}`}
                            className="btn btn-primary btn-sm w-100"
                          >
                            <i className="bi bi-folder me-1"></i>
                            View Project
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborations;