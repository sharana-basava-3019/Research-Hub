import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const VerificationRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    if (user?.designation === 'Professor') {
      fetchRequests();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/verification-requests', {
        params: { status: filterStatus }
      });
      setRequests(response.data.data.requests || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, projectTitle) => {
    const note = window.prompt(`Add an optional note for approving "${projectTitle}":`);
    if (note === null) return; // User clicked cancel

    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await api.post(`/projects/verification-requests/${requestId}/approve`, {
        note: note.trim() || undefined
      });

      toast.success(`Project "${projectTitle}" verified successfully!`);
      await fetchRequests();
    } catch (error) {
      console.error('Error approving verification request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId, projectTitle) => {
    const note = window.prompt(`Add a reason for rejecting "${projectTitle}" (optional):`);
    if (note === null) return; // User clicked cancel

    if (!window.confirm(`Are you sure you want to reject the verification request for "${projectTitle}"?`)) {
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await api.post(`/projects/verification-requests/${requestId}/reject`, {
        note: note.trim() || undefined
      });

      toast.success(`Verification request rejected`);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting verification request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingIds(prev => {
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'APPROVED':
        return 'bg-success';
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Please log in to access this page.
        </div>
      </div>
    );
  }

  if (user.designation !== 'Professor') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-shield-x me-2"></i>
          Only professors can access verification requests.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">
            <i className="bi bi-patch-check text-success me-2"></i>
            Verification Requests
          </h1>
          <p className="text-muted">
            Review and approve project verification requests from students and researchers
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group w-100" role="group">
            <button
              className={`btn ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              <i className="bi bi-clock-history me-2"></i>
              Pending
            </button>
            <button
              className={`btn ${filterStatus === 'APPROVED' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterStatus('APPROVED')}
            >
              <i className="bi bi-check-circle me-2"></i>
              Approved
            </button>
            <button
              className={`btn ${filterStatus === 'REJECTED' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterStatus('REJECTED')}
            >
              <i className="bi bi-x-circle me-2"></i>
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading verification requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
            <h4 className="text-muted">No {filterStatus.toLowerCase()} requests</h4>
            <p className="text-muted">
              {filterStatus === 'PENDING'
                ? 'There are no pending verification requests at this time'
                : `No ${filterStatus.toLowerCase()} requests found`}
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {requests.map((request) => (
            <div key={request._id} className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="d-flex align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h5 className="card-title mb-2">
                            <Link
                              to={`/projects/${request.project?._id}`}
                              className="text-decoration-none text-dark"
                            >
                              {request.project?.title || 'Project'}
                            </Link>
                          </h5>
                          <p className="text-muted mb-2">
                            {request.project?.description?.substring(0, 150)}
                            {request.project?.description?.length > 150 && '...'}
                          </p>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                            {request.project?.researchArea && (
                              <span className="badge bg-info">
                                {request.project.researchArea}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-top pt-3">
                        <div className="row g-3">
                          <div className="col-sm-6">
                            <small className="text-muted d-block">Requested by</small>
                            <strong>
                              {request.requester?.firstName} {request.requester?.lastName}
                            </strong>
                            <br />
                            <small className="text-muted">
                              {request.requester?.institution}
                            </small>
                          </div>
                          <div className="col-sm-6">
                            <small className="text-muted d-block">Request Date</small>
                            <strong>{formatDate(request.createdAt)}</strong>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mt-3">
                            <small className="text-muted d-block mb-1">Message:</small>
                            <div className="alert alert-light mb-0">
                              <i className="bi bi-chat-left-quote me-2"></i>
                              {request.message}
                            </div>
                          </div>
                        )}

                        {request.response_note && (
                          <div className="mt-3">
                            <small className="text-muted d-block mb-1">Response Note:</small>
                            <div className="alert alert-light mb-0">
                              <i className="bi bi-reply me-2"></i>
                              {request.response_note}
                            </div>
                          </div>
                        )}

                        {request.processed_by && (
                          <div className="mt-3">
                            <small className="text-muted">
                              Processed by {request.processed_by.firstName}{' '}
                              {request.processed_by.lastName} on{' '}
                              {formatDate(request.processed_at)}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex flex-column gap-2 h-100 justify-content-center">
                        <Link
                          to={`/projects/${request.project?._id}`}
                          className="btn btn-outline-primary w-100"
                        >
                          <i className="bi bi-eye me-2"></i>
                          View Project
                        </Link>

                        {request.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-success w-100"
                              onClick={() =>
                                handleApprove(request._id, request.project?.title)
                              }
                              disabled={processingIds.has(request._id)}
                            >
                              {processingIds.has(request._id) ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-circle me-2"></i>
                                  Approve & Verify
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-outline-danger w-100"
                              onClick={() =>
                                handleReject(request._id, request.project?.title)
                              }
                              disabled={processingIds.has(request._id)}
                            >
                              {processingIds.has(request._id) ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-x-circle me-2"></i>
                                  Reject Request
                                </>
                              )}
                            </button>
                          </>
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

export default VerificationRequests;
