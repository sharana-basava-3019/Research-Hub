import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import RevokeCollaborationModal from '../components/RevokeCollaborationModal';

const Collaborations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // received, sent, all
  const [filterStatus, setFilterStatus] = useState(''); // Pending, Accepted, Rejected, Cancelled
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Quick Stat Inspection
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // pending, accepted, rejected, total
  const [modalData, setModalData] = useState([]);

  // Revocation / Exit Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeModalMode, setRevokeModalMode] = useState('revoke'); // 'revoke' | 'exit'
  const [selectedCollabForRevoke, setSelectedCollabForRevoke] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId) {
      fetchCollaborations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterStatus, userId]);

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
      setCollaborations(response.data?.data?.collaborations || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      toast.error(error.response?.data?.message || 'Failed to load collaborations', { toastId: 'collab-error' });
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

  const handleOpenRevoke = (collab, mode = 'revoke') => {
    setSelectedCollabForRevoke(collab);
    setRevokeModalMode(mode);
    setRevokeModalOpen(true);
  };

  const handleCloseRevoke = () => {
    setRevokeModalOpen(false);
    setSelectedCollabForRevoke(null);
    setRevokeModalMode('revoke');
  };

  const handleConfirmRevoke = async (reason) => {
    if (!selectedCollabForRevoke) return;
    try {
      setRevokeLoading(true);
      if (revokeModalMode === 'exit') {
        const res = await api.put(`/collaborations/${selectedCollabForRevoke._id}/exit`, { reason });
        toast.success(res.data?.message || 'You have exited the collaboration successfully');
      } else {
        const res = await api.put(`/collaborations/${selectedCollabForRevoke._id}/revoke`, { reason });
        toast.success(res.data?.message || 'Collaboration revoked successfully');
      }
      handleCloseRevoke();
      fetchCollaborations();
    } catch (error) {
      const defaultMsg = revokeModalMode === 'exit' ? 'Failed to exit collaboration' : 'Failed to revoke collaboration';
      toast.error(error.response?.data?.message || defaultMsg);
    } finally {
      setRevokeLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvatarUrl = (u) => {
    if (u?.profilePicture && u.profilePicture !== 'default-avatar.jpg') {
      return u.profilePicture;
    }
    const name = `${u?.firstName || 'User'} ${u?.lastName || ''}`.trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=96`;
  };

  const handleStatClick = (type) => {
    let filteredData = [];
    let title = '';

    switch (type) {
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

  // Local search filter
  const displayedCollaborations = useMemo(() => {
    if (!searchQuery.trim()) return collaborations;
    const q = searchQuery.toLowerCase().trim();
    return collaborations.filter((c) => {
      const senderName = `${c.sender?.firstName || ''} ${c.sender?.lastName || ''}`.toLowerCase();
      const receiverName = `${c.receiver?.firstName || ''} ${c.receiver?.lastName || ''}`.toLowerCase();
      const projTitle = (c.project?.title || '').toLowerCase();
      const role = (c.proposedRole || '').toLowerCase();
      const msg = (c.message || '').toLowerCase();
      const status = (c.status || '').toLowerCase();
      return (
        senderName.includes(q) ||
        receiverName.includes(q) ||
        projTitle.includes(q) ||
        role.includes(q) ||
        msg.includes(q) ||
        status.includes(q)
      );
    });
  }, [collaborations, searchQuery]);

  // Counts for statistics
  const pendingCount = useMemo(() => collaborations.filter(c => c.status === 'Pending').length, [collaborations]);
  const acceptedCount = useMemo(() => collaborations.filter(c => c.status === 'Accepted').length, [collaborations]);
  const rejectedCount = useMemo(() => collaborations.filter(c => c.status === 'Rejected').length, [collaborations]);
  const totalCount = collaborations.length;

  if (!user) {
    return (
      <div className="page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <div className="card shadow-sm mx-auto text-center p-5" style={{ maxWidth: '440px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div
              className="rh-icon-circle mb-3 mx-auto shadow-xs"
              style={{ width: '64px', height: '64px', backgroundColor: '#eef2ff', color: '#4f46e5' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h4 className="fw-bold mb-2 text-dark">Authentication Required</h4>
            <p className="text-muted small mb-4">Please log in to your researcher account to manage your collaboration requests and partnerships.</p>
            <Link to="/login" className="btn btn-primary w-100 py-2.5 fw-semibold" style={{ borderRadius: '10px' }}>
              <i className="bi bi-box-arrow-in-right me-2"></i>Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ minHeight: 'calc(100vh - 65px)', backgroundColor: '#f8fafc', paddingBottom: '3.5rem' }}>
      {/* Modal for Stat Inspection — rendered via portal at document.body so it covers the full viewport */}
      {showModal && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(15,23,42,0.25), 0 4px 16px rgba(15,23,42,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  backgroundColor: 'rgba(79,70,229,0.08)',
                  color: '#4f46e5',
                  border: '1px solid rgba(79,70,229,0.2)',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {modalData.length} records
                </span>
                <h6 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', letterSpacing: '0.01em', textTransform: 'uppercase' }}>
                  {modalType}
                </h6>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13" />
                  <line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modalData.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div
                    className="rh-icon-circle mx-auto mb-3"
                    style={{ width: '56px', height: '56px', backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>No collaborations in this category</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Items will appear here once available</p>
                </div>
              ) : (
                <div>
                  {modalData.map((collab, index) => {
                    const isCurrentUserSender = (collab.sender?._id || collab.sender) === userId;
                    const displayPerson = isCurrentUserSender ? collab.receiver : collab.sender;
                    const displayRoleLabel = isCurrentUserSender ? 'Recipient' : 'Requester';

                    return (
                      <div
                        key={collab._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          padding: '0.85rem 1.25rem',
                          borderBottom: index < modalData.length - 1 ? '1px solid #f1f5f9' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <img
                            src={getAvatarUrl(displayPerson)}
                            alt="Avatar"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                {displayPerson?.firstName} {displayPerson?.lastName}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 500,
                                color: '#64748b',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontFamily: 'monospace',
                              }}>
                                {displayRoleLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              <Link
                                to={`/projects/${collab.project?._id}`}
                                style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}
                                onClick={closeModal}
                              >
                                {collab.project?.title || 'Project'}
                              </Link>
                              <span style={{ margin: '0 5px', color: '#cbd5e1' }}>•</span>
                              <span>{collab.proposedRole || 'Collaborator'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            ...(collab.status === 'Accepted'
                              ? { backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' }
                              : collab.status === 'Rejected'
                              ? { backgroundColor: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.25)' }
                              : collab.status === 'Cancelled'
                              ? { backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)' }
                              : { backgroundColor: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.3)' }),
                          }}>
                            {collab.status}
                          </span>

                          {collab.status === 'Pending' && activeTab === 'received' && (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', fontSize: '0.76rem', fontWeight: 600,
                                  backgroundColor: '#16a34a', color: '#fff', border: 'none',
                                  borderRadius: '6px', cursor: 'pointer',
                                }}
                                onClick={(e) => { e.stopPropagation(); handleAccept(collab._id); closeModal(); }}
                              >
                                <i className="bi bi-check2"></i> Accept
                              </button>
                              <button
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', fontSize: '0.76rem', fontWeight: 600,
                                  backgroundColor: 'transparent', color: '#dc2626',
                                  border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer',
                                }}
                                onClick={(e) => { e.stopPropagation(); handleReject(collab._id); closeModal(); }}
                              >
                                <i className="bi bi-x"></i> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Container */}
      <div className="container py-4">
        {/* Top Header Banner */}
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 text-primary fw-semibold small mb-1" style={{ letterSpacing: '0.05em' }}>
              <i className="bi bi-people-fill"></i>
              <span>NETWORK & PARTNERSHIPS</span>
            </div>
            <h1 className="h2 fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
              Collaborations
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: '0.92rem' }}>
              Manage incoming requests, track project invitations, and build active research partnerships.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/send-collaboration-request')}
              className="btn btn-primary d-inline-flex align-items-center gap-2 px-3.5 py-2.5 shadow-sm"
              style={{
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="bi bi-plus-lg"></i>
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Top 4 Interactive Metric Cards */}
        <div className="row g-3 mb-4">
          {/* Card 1: Pending */}
          <div className="col-6 col-lg-3">
            <div
              className="card h-100 border shadow-xs"
              onClick={() => handleStatClick('pending')}
              style={{
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #f59e0b'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(245, 158, 11, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-3.5">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Pending
                  </span>
                  <div
                    className="rh-icon-circle"
                    style={{ width: '36px', height: '36px', backgroundColor: '#fffbeb', color: '#d97706' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M5 22h14" />
                      <path d="M5 2h14" />
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                    </svg>
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-3 fw-bold text-dark lh-1">{pendingCount}</span>
                  <span className="badge bg-warning bg-opacity-10 text-warning">
                    Needs review
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Accepted */}
          <div className="col-6 col-lg-3">
            <div
              className="card h-100 border shadow-xs"
              onClick={() => handleStatClick('accepted')}
              style={{
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #10b981'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-3.5">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Accepted
                  </span>
                  <div
                    className="rh-icon-circle"
                    style={{ width: '36px', height: '36px', backgroundColor: '#ecfdf5', color: '#059669' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-3 fw-bold text-dark lh-1">{acceptedCount}</span>
                  <span className="badge bg-success bg-opacity-10 text-success">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Rejected */}
          <div className="col-6 col-lg-3">
            <div
              className="card h-100 border shadow-xs"
              onClick={() => handleStatClick('rejected')}
              style={{
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #ef4444'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-3.5">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Declined
                  </span>
                  <div
                    className="rh-icon-circle"
                    style={{ width: '34px', height: '34px', backgroundColor: '#fef2f2', color: '#dc2626' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-3 fw-bold text-dark lh-1">{rejectedCount}</span>
                  <span className="badge bg-danger bg-opacity-10 text-danger">
                    Closed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Total */}
          <div className="col-6 col-lg-3">
            <div
              className="card h-100 border shadow-xs"
              onClick={() => handleStatClick('total')}
              style={{
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #4f46e5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(79, 70, 229, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="card-body p-3.5">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
                    Total Connections
                  </span>
                  <div
                    className="rh-icon-circle"
                    style={{ width: '34px', height: '34px', backgroundColor: '#eef2ff', color: '#4f46e5' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-3 fw-bold text-dark lh-1">{totalCount}</span>
                  <span className="badge bg-primary bg-opacity-10 text-primary">
                    All records
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Card: Tabs + Search + Status Filter */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px', backgroundColor: '#ffffff' }}>
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              {/* Segmented Pill Navigation Tabs */}
              <div className="col-12 col-md-auto">
                <div
                  className="d-inline-flex p-1 bg-light border rounded-3 w-100 w-md-auto"
                  style={{ gap: '4px' }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 border-0 fw-semibold ${
                      activeTab === 'received'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-secondary hover-bg-light'
                    }`}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setActiveTab('received')}
                  >
                    <i className="bi bi-inbox-fill"></i>
                    <span>Received</span>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 border-0 fw-semibold ${
                      activeTab === 'sent'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-secondary hover-bg-light'
                    }`}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setActiveTab('sent')}
                  >
                    <i className="bi bi-send-fill"></i>
                    <span>Sent</span>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 border-0 fw-semibold ${
                      activeTab === 'all'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-secondary hover-bg-light'
                    }`}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setActiveTab('all')}
                  >
                    <i className="bi bi-collection-fill"></i>
                    <span>All</span>
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="col-12 col-md">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted" style={{ borderRadius: '8px 0 0 8px', borderColor: '#e2e8f0' }}>
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-light"
                    placeholder="Search by researcher, project title, role, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      borderColor: '#e2e8f0',
                      fontSize: '0.88rem'
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-light border border-start-0 text-muted"
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ borderRadius: '0 8px 8px 0', borderColor: '#e2e8f0' }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center gap-2">
                  <div className="input-group" style={{ minWidth: '180px' }}>
                    <span className="input-group-text bg-light border-end-0 text-muted" style={{ borderRadius: '8px 0 0 8px', borderColor: '#e2e8f0' }}>
                      <i className="bi bi-funnel"></i>
                    </span>
                    <select
                      className="form-select border-start-0 bg-light"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{
                        borderRadius: '0 8px 8px 0',
                        borderColor: '#e2e8f0',
                        fontSize: '0.88rem',
                        fontWeight: '500'
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {(filterStatus || searchQuery) && (
                    <button
                      className="btn btn-outline-secondary btn-sm px-2.5 py-2"
                      onClick={() => {
                        setFilterStatus('');
                        setSearchQuery('');
                      }}
                      title="Clear Filters"
                      style={{ borderRadius: '8px' }}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="card border-0 shadow-sm p-5 text-center my-4" style={{ borderRadius: '16px' }}>
            <div className="d-flex flex-column align-items-center justify-content-center py-4">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h6 className="fw-bold text-dark mb-1">Loading Collaborations</h6>
              <p className="text-muted small mb-0">Retrieving records from the research network...</p>
            </div>
          </div>
        ) : displayedCollaborations.length === 0 ? (
          /* Empty State */
          <div
            className="card border-0 shadow-sm text-center p-5 my-3"
            style={{
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="py-4 px-2 mx-auto" style={{ maxWidth: '520px' }}>
              <div
                className="rh-icon-circle mb-3.5 mx-auto shadow-xs"
                style={{
                  width: '68px',
                  height: '68px',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5'
                }}
              >
                {searchQuery || filterStatus ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ) : activeTab === 'sent' ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', transform: 'translate(-1px, 1px)' }}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                ) : activeTab === 'all' ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                )}
              </div>

              <h4 className="fw-bold text-dark mb-2">
                {searchQuery || filterStatus
                  ? 'No matching collaborations found'
                  : activeTab === 'received'
                  ? 'No incoming collaboration requests'
                  : activeTab === 'sent'
                  ? 'No sent collaboration requests'
                  : 'No collaborations found'}
              </h4>

              <p className="text-muted mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                {searchQuery || filterStatus
                  ? 'Try adjusting your search keywords or clearing your status filter to see more records.'
                  : activeTab === 'received'
                  ? 'When other researchers request to join your projects or invite you to theirs, you will see their details and be able to accept them here.'
                  : activeTab === 'sent'
                  ? 'You haven\'t sent any collaboration requests or invitations yet. Discover open projects or invite talented researchers to your team.'
                  : 'You have no collaboration activity logged yet. Start collaborating by browsing open research projects or creating your own.'}
              </p>

              <div className="d-flex align-items-center justify-content-center flex-wrap gap-2.5">
                {(searchQuery || filterStatus) ? (
                  <button
                    className="btn btn-outline-primary px-3.5 py-2 fw-semibold"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('');
                    }}
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="bi bi-x-circle me-1.5"></i> Clear Search & Filters
                  </button>
                ) : (
                  <>
                    <Link
                      to="/projects"
                      className="btn btn-primary px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="bi bi-grid-fill"></i>
                      Browse Projects
                    </Link>
                    <Link
                      to="/send-collaboration-request"
                      className="btn btn-outline-secondary px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="bi bi-envelope-plus-fill"></i>
                      Invite Collaborator
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List of Collaborations */
          <div className="d-flex flex-column gap-3">
            {displayedCollaborations.map((collab) => {
              const isCurrentUserSender = (collab.sender?._id || collab.sender) === userId;
              const otherPerson = isCurrentUserSender ? collab.receiver : collab.sender;
              const directionLabel = isCurrentUserSender ? 'To Invitee / Lead' : 'From Requester';

              const statusColorMap = {
                Pending: { bg: '#fffbeb', text: '#d97706', border: '#fef3c7', leftBorder: '#f59e0b', dot: '#f59e0b' },
                Accepted: { bg: '#ecfdf5', text: '#059669', border: '#d1fae5', leftBorder: '#10b981', dot: '#10b981' },
                Rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2', leftBorder: '#ef4444', dot: '#ef4444' },
                Cancelled: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', leftBorder: '#94a3b8', dot: '#94a3b8' },
                Revoked: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', leftBorder: '#dc2626', dot: '#dc2626' },
                Exited: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', leftBorder: '#64748b', dot: '#64748b' }
              };
              const statusStyle = statusColorMap[collab.status] || statusColorMap.Pending;

              const projectOwnerId = String(collab.project?.owner?._id || collab.project?.owner?.id || collab.project?.owner || '');
              const currentUserId = String(userId || '');
              const isProjectOwner = Boolean(projectOwnerId && projectOwnerId === currentUserId);
              const isAdmin = user?.role === 'admin';
              const rawCollabUser = collab.collaborationType === 'invite' ? collab.receiver : collab.sender;
              const collabUserId = String(rawCollabUser?._id || rawCollabUser || '');
              const isCollaborator = Boolean(collabUserId && collabUserId === currentUserId && !isProjectOwner);

              return (
                <div
                  key={collab._id}
                  className="card border shadow-xs"
                  style={{
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    borderLeft: `4.5px solid ${statusStyle.leftBorder}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <div className="card-body p-3.5 p-md-4">
                    <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
                      {/* Left: Person Identity & Role Info */}
                      <div className="d-flex align-items-start gap-3 flex-grow-1 min-w-0">
                        <img
                          src={getAvatarUrl(otherPerson)}
                          alt="Avatar"
                          className="rounded-circle flex-shrink-0 shadow-xs"
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                          }}
                        />

                        <div className="min-w-0 flex-grow-1">
                          {/* Row 1: Name, Direction tag, and Status Badge */}
                          <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                            <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                              {otherPerson ? `${otherPerson.firstName || ''} ${otherPerson.lastName || ''}`.trim() || 'Researcher' : 'User'}
                            </span>

                            {otherPerson?.username && (
                              <span className="text-muted small font-monospace">
                                @{otherPerson.username}
                              </span>
                            )}

                            <span
                              className="badge bg-light text-muted border font-monospace"
                              style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                            >
                              {directionLabel}
                            </span>

                            {/* Status Pill with dot */}
                            <span
                              className="badge d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.text,
                                border: `1px solid ${statusStyle.border}`,
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                borderRadius: '999px'
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: statusStyle.dot
                                }}
                              ></span>
                              {collab.status}
                            </span>

                            {/* Collaborator Count Tag */}
                            {collab.project && (
                              <span
                                className="badge d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                style={{
                                  backgroundColor: '#f8fafc',
                                  color: '#334155',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '0.74rem',
                                  fontWeight: '600',
                                  borderRadius: '999px'
                                }}
                                title={`Team size: 1 Lead + ${collab.project.collaborators?.length || 0} Collaborators (Max: ${collab.project.maxCollaborators || 10})`}
                              >
                                <i className="bi bi-people-fill text-primary" style={{ fontSize: '0.76rem' }}></i>
                                <span>
                                  {collab.project.collaborators?.length || 0} {collab.project.collaborators?.length === 1 ? 'Collaborator' : 'Collaborators'}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Row 2: Institution & Role */}
                          <div className="d-flex align-items-center flex-wrap gap-2 text-muted small mb-2.5" style={{ fontSize: '0.83rem' }}>
                            {otherPerson?.institution && (
                              <span className="d-inline-flex align-items-center gap-1">
                                <i className="bi bi-building text-secondary"></i>
                                {otherPerson.institution}
                              </span>
                            )}

                            <span className="text-secondary">•</span>

                            <span className="d-inline-flex align-items-center gap-1 text-dark fw-medium">
                              <i className="bi bi-award text-primary"></i>
                              Proposed Role: <strong className="text-primary">{collab.proposedRole || 'Collaborator'}</strong>
                            </span>

                            <span className="text-secondary">•</span>

                            <span className="d-inline-flex align-items-center gap-1">
                              <i className="bi bi-calendar3 text-secondary"></i>
                              {formatDate(collab.createdAt)}
                            </span>
                          </div>

                          {/* Row 3: Associated Project Banner */}
                          <div className="rh-collab-project-banner mb-2">
                            <div className="rh-collab-project-link-group">
                              <i className="bi bi-folder-symlink-fill text-primary flex-shrink-0" style={{ fontSize: '0.9rem' }}></i>
                              <span className="text-muted fw-semibold flex-shrink-0" style={{ fontSize: '0.84rem' }}>
                                Project:
                              </span>
                              <Link
                                to={`/projects/${collab.project?._id}`}
                                className="fw-bold text-primary text-decoration-none hover-underline text-truncate"
                                style={{ maxWidth: '380px', fontSize: '0.86rem' }}
                              >
                                {collab.project?.title || 'View Project'}
                              </Link>
                            </div>
                            {collab.project?.researchArea && (
                              <span className="rh-collab-tag text-secondary">
                                <i className="bi bi-tag text-muted" style={{ fontSize: '0.72rem' }}></i>
                                <span>{collab.project.researchArea}</span>
                              </span>
                            )}
                            {collab.project && (
                              <span
                                className="rh-collab-tag text-muted"
                                title={`${collab.project.collaborators?.length || 0} of ${collab.project.maxCollaborators || 10} slots occupied`}
                              >
                                <i className="bi bi-people text-primary" style={{ fontSize: '0.75rem' }}></i>
                                <span>{(collab.project.collaborators?.length || 0) + 1} Total Members</span>
                              </span>
                            )}
                          </div>

                          {/* Row 4: Message / Quote */}
                          {collab.message && (
                            <div
                              className="p-2.5 rounded-3 bg-light text-secondary mt-1"
                              style={{
                                fontSize: '0.84rem',
                                borderLeft: '3px solid #cbd5e1',
                                fontStyle: 'italic',
                                backgroundColor: '#f8fafc'
                              }}
                            >
                              <i className="bi bi-chat-quote-fill me-2 text-muted opacity-75"></i>
                              &ldquo;{collab.message}&rdquo;
                            </div>
                          )}

                          {/* Revocation Reason Callout */}
                          {collab.status === 'Revoked' && collab.response?.message && (
                            <div
                              className="p-2.5 rounded-3 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 mt-2"
                              style={{ fontSize: '0.84rem' }}
                            >
                              <i className="bi bi-exclamation-circle-fill me-1.5" />
                              <strong>Revocation Reason:</strong> &ldquo;{collab.response.message}&rdquo;
                            </div>
                          )}

                          {/* Exit Reason Callout */}
                          {collab.status === 'Exited' && collab.response?.message && (
                            <div
                              className="p-2.5 rounded-3 bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 mt-2"
                              style={{ fontSize: '0.84rem' }}
                            >
                              <i className="bi bi-box-arrow-right me-1.5" />
                              <strong>Exit Reason:</strong> &ldquo;{collab.response.message}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div className="d-flex align-items-center gap-2 flex-shrink-0 align-self-stretch align-self-lg-center justify-content-end pt-2 pt-lg-0 border-top border-top-lg-0">
                        {/* Received & Pending -> Accept / Reject */}
                        {activeTab === 'received' && collab.status === 'Pending' && (
                          <div className="d-flex gap-2 w-100 w-lg-auto">
                            <button
                              className="btn btn-success btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold shadow-xs"
                              style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                              onClick={() => handleAccept(collab._id)}
                            >
                              <i className="bi bi-check2-circle"></i>
                              <span>Accept</span>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold"
                              style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                              onClick={() => handleReject(collab._id)}
                            >
                              <i className="bi bi-x-circle"></i>
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* Sent & Pending or Pending invite from Owner -> Revoke Invite */}
                        {collab.status === 'Pending' && (activeTab === 'sent' || isCurrentUserSender || isProjectOwner || isAdmin) && (
                          <button
                            className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold"
                            style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                            onClick={() => handleOpenRevoke(collab, 'revoke')}
                          >
                            <i className="bi bi-person-x"></i>
                            <span>Revoke Invite</span>
                          </button>
                        )}

                        {/* Accepted -> View Project + Owner Removal OR Collaborator Exit */}
                        {collab.status === 'Accepted' && (
                          <div className="d-flex gap-2 w-100 w-lg-auto flex-wrap justify-content-end">
                            <Link
                              to={`/projects/${collab.project?._id}`}
                              className="btn btn-primary btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold shadow-xs"
                              style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                            >
                              <i className="bi bi-folder2-open"></i>
                              <span>View Project</span>
                            </Link>

                            {/* ONLY Project Owner / Admin can Remove Member */}
                            {(isProjectOwner || isAdmin) && (
                              <button
                                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold"
                                style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                                onClick={() => handleOpenRevoke(collab, 'revoke')}
                                title="Remove member from project and revoke collaboration"
                              >
                                <i className="bi bi-person-x-fill"></i>
                                <span>Remove Member</span>
                              </button>
                            )}

                            {/* Accepted Collaborator (Non-Owner) can EXIT from collaboration */}
                            {isCollaborator && (
                              <button
                                className="btn btn-outline-warning btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-2 fw-semibold text-dark"
                                style={{ borderRadius: '8px', fontSize: '0.84rem', borderColor: '#fdba74', backgroundColor: '#fff7ed' }}
                                onClick={() => handleOpenRevoke(collab, 'exit')}
                                title="Exit from collaboration and leave project"
                              >
                                <i className="bi bi-box-arrow-right text-warning"></i>
                                <span>Exit Collaboration</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Minimalist Confirmation Modal for Revoking or Exiting Collaborations */}
        <RevokeCollaborationModal
          isOpen={revokeModalOpen}
          onClose={handleCloseRevoke}
          onConfirm={handleConfirmRevoke}
          collaboration={selectedCollabForRevoke}
          mode={revokeModalMode}
          loading={revokeLoading}
        />
      </div>
    </div>
  );
};

export default Collaborations;