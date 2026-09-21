import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const VerificationRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL_VERIFIED
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  const isProfessor = user?.designation === 'Professor' || user?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/verification-requests', {
        params: { status: filterStatus }
      });
      setRequests(response.data?.data?.requests || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load verification requests', {
        toastId: 'verif-error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, projectTitle) => {
    const note = window.prompt(`Add an optional endorsement note for verifying "${projectTitle}":`);
    if (note === null) return; // User clicked cancel

    try {
      setProcessingIds((prev) => new Set(prev).add(requestId));
      await api.post(`/projects/verification-requests/${requestId}/approve`, {
        note: note.trim() || undefined
      });

      toast.success(`Project "${projectTitle}" verified successfully!`);
      await fetchRequests();
    } catch (error) {
      console.error('Error approving verification request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId, projectTitle) => {
    const note = window.prompt(`Add feedback / reason for declining "${projectTitle}" (optional):`);
    if (note === null) return; // User clicked cancel

    if (!window.confirm(`Are you sure you want to reject the verification request for "${projectTitle}"?`)) {
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(requestId));
      await api.post(`/projects/verification-requests/${requestId}/reject`, {
        note: note.trim() || undefined
      });

      toast.success(`Verification request rejected`);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarUrl = (u) => {
    if (u?.profilePicture) return u.profilePicture;
    const name = `${u?.firstName || 'User'} ${u?.lastName || ''}`.trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=96`;
  };

  // Local search filter
  const displayedRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const projTitle = (r.project?.title || '').toLowerCase();
      const projDesc = (r.project?.description || '').toLowerCase();
      const researchArea = (r.project?.researchArea || '').toLowerCase();
      const reqName = `${r.requester?.firstName || ''} ${r.requester?.lastName || ''}`.toLowerCase();
      const profName = `${r.processed_by?.firstName || ''} ${r.processed_by?.lastName || ''}`.toLowerCase();
      const msg = (r.message || '').toLowerCase();
      const note = (r.response_note || '').toLowerCase();

      return (
        projTitle.includes(q) ||
        projDesc.includes(q) ||
        researchArea.includes(q) ||
        reqName.includes(q) ||
        profName.includes(q) ||
        msg.includes(q) ||
        note.includes(q)
      );
    });
  }, [requests, searchQuery]);

  // Auth requirement check
  if (!user) {
    return (
      <div className="page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="card shadow-sm mx-auto text-center p-5" style={{ maxWidth: '440px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
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
            <p className="text-muted small mb-4">Please log in to your account to review verification requests and explore verified research.</p>
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
      <div className="container py-4">
        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-2 border-bottom">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-2.5 py-1 mb-2 rounded-pill" style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>{isProfessor ? 'FACULTY VERIFICATION PORTAL' : 'PROJECT VERIFICATION CENTER'}</span>
            </div>
            <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
              {isProfessor ? 'Professor Verification Requests' : 'Project Verifications & Endorsements'}
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.92rem' }}>
              {isProfessor
                ? 'Review, verify, and endorse academic projects submitted by students and researchers.'
                : 'Track professor endorsements for your projects and explore faculty-verified academic research.'}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/projects" className="btn btn-outline-primary btn-sm px-3 py-2 fw-semibold" style={{ borderRadius: '8px' }}>
              <i className="bi bi-grid me-1.5"></i>Browse Projects
            </Link>
            <Link to="/dashboard" className="btn btn-light btn-sm px-3 py-2 border text-secondary fw-semibold" style={{ borderRadius: '8px' }}>
              <i className="bi bi-arrow-left me-1.5"></i>Dashboard
            </Link>
          </div>
        </div>

        {/* Toolbar: Tabs + Search */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px' }}>
          <div className="card-body p-3">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              {/* Filter Tabs */}
              <div className="d-flex flex-wrap gap-1 p-1 bg-light rounded-pill border" style={{ maxWidth: 'fit-content' }}>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1.5 rounded-pill fw-semibold transition-all ${
                    filterStatus === 'PENDING' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setFilterStatus('PENDING')}
                  style={{ fontSize: '0.84rem' }}
                >
                  <i className="bi bi-clock-history me-1.5"></i>
                  {isProfessor ? 'Pending Review' : 'My Pending Requests'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1.5 rounded-pill fw-semibold transition-all ${
                    filterStatus === 'APPROVED' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setFilterStatus('APPROVED')}
                  style={{ fontSize: '0.84rem' }}
                >
                  <i className="bi bi-check-circle-fill me-1.5 text-success"></i>
                  {isProfessor ? 'Verified by Faculty' : 'My Verified Projects'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1.5 rounded-pill fw-semibold transition-all ${
                    filterStatus === 'REJECTED' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setFilterStatus('REJECTED')}
                  style={{ fontSize: '0.84rem' }}
                >
                  <i className="bi bi-x-circle me-1.5 text-danger"></i>
                  {isProfessor ? 'Declined' : 'Needs Revision'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-1.5 rounded-pill fw-semibold transition-all ${
                    filterStatus === 'ALL_VERIFIED' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setFilterStatus('ALL_VERIFIED')}
                  style={{ fontSize: '0.84rem' }}
                >
                  <i className="bi bi-award-fill me-1.5 text-warning"></i>
                  All Verified Research
                </button>
              </div>

              {/* Search Bar */}
              <div className="position-relative" style={{ minWidth: '260px' }}>
                <input
                  type="text"
                  className="form-control ps-5 bg-light border-0"
                  placeholder="Filter by title, researcher, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.9rem', minHeight: '44px' }}
                />
                <i className="bi bi-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
                {searchQuery && (
                  <button
                    className="btn btn-link btn-sm position-absolute text-muted p-0"
                    style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', textDecoration: 'none' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Requests List / Content */}
        {loading ? (
          <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: '16px' }}>
            <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="fw-semibold text-dark mb-1">Loading verification records...</h6>
            <p className="text-muted small mb-0">Connecting to academic verification ledger</p>
          </div>
        ) : displayedRequests.length === 0 ? (
          /* Empty State */
          <div className="card border-0 shadow-sm text-center py-5 px-4" style={{ borderRadius: '16px', backgroundColor: '#fff' }}>
            <div
              className="rh-icon-circle mx-auto mb-3"
              style={{ width: '64px', height: '64px', backgroundColor: '#f1f5f9', color: '#64748b' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h5 className="fw-bold text-dark mb-1">
              {searchQuery
                ? 'No matching verification records found'
                : filterStatus === 'PENDING'
                ? 'No Pending Verification Requests'
                : filterStatus === 'APPROVED' || filterStatus === 'ALL_VERIFIED'
                ? 'No Verified Projects in this Category'
                : 'No Declined Verification Requests'}
            </h5>
            <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '460px' }}>
              {searchQuery
                ? `No results matched "${searchQuery}". Try clearing your search query.`
                : filterStatus === 'PENDING'
                ? isProfessor
                  ? 'There are currently no student or researcher projects awaiting your verification.'
                  : 'You have no active verification requests pending professor review. You can submit your projects for verification from their project details page.'
                : filterStatus === 'APPROVED' || filterStatus === 'ALL_VERIFIED'
                ? 'No faculty-verified projects are currently registered in this section.'
                : 'No rejected requests found in your history.'}
            </p>
            <div className="d-flex justify-content-center gap-2">
              {searchQuery ? (
                <button className="btn btn-outline-primary btn-sm px-3.5 py-2 fw-semibold" style={{ borderRadius: '8px' }} onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              ) : (
                <>
                  <Link to="/projects" className="btn btn-primary btn-sm px-4 py-2 fw-semibold" style={{ borderRadius: '8px' }}>
                    <i className="bi bi-grid me-1.5"></i>Browse Projects
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline-secondary btn-sm px-3.5 py-2 fw-semibold" style={{ borderRadius: '8px' }}>
                    Back to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {displayedRequests.map((request) => {
              const isApproved = request.status === 'APPROVED' || request.project?.is_verified;
              const isPending = request.status === 'PENDING';
              const isRejected = request.status === 'REJECTED';

              const accentColor = isApproved ? '#16a34a' : isRejected ? '#dc2626' : '#ea580c';

              return (
                <div key={request._id} className="col-12">
                  <div
                    className="card border-0 shadow-sm h-100 transition-all"
                    style={{
                      borderRadius: '14px',
                      borderLeft: `4.5px solid ${accentColor}`,
                      backgroundColor: '#fff',
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="row g-3 align-items-center">
                        <div className="col-lg-8">
                          {/* Top Badges */}
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                            <span
                              className="badge px-2.5 py-1 text-uppercase"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                backgroundColor: isApproved
                                  ? 'rgba(22, 163, 74, 0.1)'
                                  : isRejected
                                  ? 'rgba(220, 38, 38, 0.1)'
                                  : 'rgba(234, 88, 12, 0.1)',
                                color: accentColor,
                                border: `1px solid ${accentColor}33`,
                                borderRadius: '999px',
                              }}
                            >
                              {isApproved ? '✓ Verified by Faculty' : isRejected ? '✕ Rejected / Revision' : '⏳ Pending Review'}
                            </span>

                            {request.project?.researchArea && (
                              <span className="badge bg-light text-secondary border" style={{ fontSize: '0.74rem' }}>
                                {request.project.researchArea}
                              </span>
                            )}

                            <span className="text-muted small ms-auto" style={{ fontSize: '0.78rem' }}>
                              Submitted {formatDate(request.createdAt)}
                            </span>
                          </div>

                          {/* Project Title & Description */}
                          <h5 className="fw-bold mb-1">
                            <Link
                              to={`/projects/${request.project?._id}`}
                              className="text-dark text-decoration-none hover-primary"
                              style={{ transition: 'color 0.15s' }}
                            >
                              {request.project?.title || 'Untitled Project'}
                            </Link>
                          </h5>
                          <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                            {request.project?.description?.substring(0, 160) || 'No description provided.'}
                            {request.project?.description?.length > 160 && '...'}
                          </p>

                          {/* Researcher Details */}
                          <div className="d-flex align-items-center gap-3 pt-2 border-top">
                            <img
                              src={getAvatarUrl(request.requester)}
                              alt="Requester Avatar"
                              className="rounded-circle shadow-xs"
                              style={{ width: '38px', height: '38px', objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                            />
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-dark small">
                                  {request.requester?.firstName} {request.requester?.lastName}
                                </span>
                                <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.68rem' }}>
                                  {request.requester?.designation || 'Researcher'}
                                </span>
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                {request.requester?.institution || 'Academic Institution'} • {request.requester?.email}
                              </small>
                            </div>
                          </div>

                          {/* Request Message */}
                          {request.message && (
                            <div className="mt-3 p-2.5 bg-light rounded border" style={{ fontSize: '0.82rem', color: '#475569' }}>
                              <i className="bi bi-chat-quote-fill me-1.5 text-primary"></i>
                              <strong>Message:</strong> "{request.message}"
                            </div>
                          )}

                          {/* Professor Response Note */}
                          {request.response_note && (
                            <div
                              className="mt-2 p-2.5 rounded border"
                              style={{
                                fontSize: '0.82rem',
                                backgroundColor: isApproved ? '#f0fdf4' : '#fef2f2',
                                borderColor: isApproved ? '#bbf7d0' : '#fecaca',
                                color: isApproved ? '#166534' : '#991b1b',
                              }}
                            >
                              <i className={`bi ${isApproved ? 'bi-patch-check-fill' : 'bi-exclamation-octagon-fill'} me-1.5`}></i>
                              <strong>Faculty Note:</strong> "{request.response_note}"
                              {request.processed_by && (
                                <span className="d-block small mt-1 text-muted">
                                  — Evaluated by Prof. {request.processed_by.firstName} {request.processed_by.lastName} on {formatDate(request.processed_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="col-lg-4 text-lg-end">
                          <div className="d-flex flex-column gap-2 justify-content-center">
                            <Link
                              to={`/projects/${request.project?._id}`}
                              className="btn btn-outline-primary btn-sm py-2 px-3 fw-semibold"
                              style={{ borderRadius: '8px' }}
                            >
                              <i className="bi bi-arrow-up-right-square me-1.5"></i>
                              Inspect Project
                            </Link>

                            {/* Professor Decision Actions for Pending Requests */}
                            {isProfessor && isPending && (
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-success btn-sm py-2 flex-grow-1 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                                  style={{ borderRadius: '8px' }}
                                  onClick={() => handleApprove(request._id, request.project?.title)}
                                  disabled={processingIds.has(request._id)}
                                >
                                  {processingIds.has(request._id) ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm"></span>
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-check2-circle"></i>
                                      Verify
                                    </>
                                  )}
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm py-2 flex-grow-1 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                                  style={{ borderRadius: '8px' }}
                                  onClick={() => handleReject(request._id, request.project?.title)}
                                  disabled={processingIds.has(request._id)}
                                >
                                  {processingIds.has(request._id) ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm"></span>
                                      Rejecting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-x-circle"></i>
                                      Decline
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationRequests;
