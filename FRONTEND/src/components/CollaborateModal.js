import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const CollaborateModal = ({ show, onClose, targetUser, project }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [proposedRole, setProposedRole] = useState('');
  const [showOtherRole, setShowOtherRole] = useState(false);
  const [otherRoleText, setOtherRoleText] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    'Co-Investigator',
    'Research Associate',
    'Data Analyst',
    'Technical Lead',
    'Research Assistant',
    'Lab Manager',
    'Post-Doctoral Researcher',
    'Graduate Student Researcher',
    'Statistical Consultant',
    'Subject Matter Expert',
    'Other'
  ];

  useEffect(() => {
    if (show && user) {
      fetchMyProjects();
      // Set default project if one was passed
      if (project) {
        setSelectedProjectId(project._id || project);
      }
    }
  }, [show, user, project]);

  const fetchMyProjects = async () => {
    try {
      const response = await api.get('/projects/my');
      setProjects(response.data.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const targetUserId = targetUser?._id || targetUser?.id || (typeof targetUser === 'string' ? targetUser : null);
    if (!targetUserId) {
      toast.error('Recipient user information is missing');
      return;
    }

    // Determine the final role value
    const finalRole = showOtherRole ? otherRoleText.trim() : proposedRole;

    try {
      setLoading(true);
      await api.post('/collaborations', {
        receiverId: targetUserId,
        projectId: selectedProjectId,
        message: message.trim(),
        proposedRole: finalRole || 'Collaborator'
      });

      toast.success('Collaboration request sent successfully!');
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send collaboration request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProjectId('');
    setMessage('');
    setProposedRole('');
    setShowOtherRole(false);
    setOtherRoleText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  const userName = targetUser?.firstName && targetUser?.lastName 
    ? `${targetUser.firstName} ${targetUser.lastName}`
    : targetUser?.name || 'this user';

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ border: '2px solid #dee2e6', borderRadius: '0.5rem' }}>
          <div className="modal-header" style={{
            background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)',
            border: 'none',
            padding: '20px 24px',
            color: 'white'
          }}>
            <h5 className="modal-title mb-0" style={{ fontWeight: '700', fontSize: '1.3rem' }}>
              <i className="bi bi-handshake me-2"></i>
              Send Collaboration Request
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={handleClose}
              style={{ filter: 'brightness(0) invert(1)' }}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ backgroundColor: '#ffffff' }}>
              <div className="alert" style={{
                backgroundColor: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px'
              }}>
                <i className="bi bi-info-circle me-2" style={{ color: '#0d6efd' }}></i>
                <span style={{ color: '#004085' }}>
                  You are sending a collaboration request to <strong>{userName}</strong>
                </span>
              </div>

              <div className="row g-4">
                {/* Project Selection Section */}
                <div className="col-12">
                  <h6 className="mb-3" style={{ color: '#0d6efd', fontWeight: '600', fontSize: '1rem' }}>
                    <i className="bi bi-folder me-2"></i>
                    Project Information
                  </h6>
                </div>

                {/* Select Project */}
                <div className="col-12">
                  <label htmlFor="project" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                    <i className="bi bi-briefcase me-1" style={{ color: '#0d6efd' }}></i>
                    Select Project <span className="text-danger">*</span>
                  </label>
                  <select
                    id="project"
                    className="form-select form-select-lg"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    disabled={!!project}
                    style={{ 
                      backgroundColor: project ? '#f8f9fa' : '#ffffff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      cursor: project ? 'not-allowed' : 'pointer'
                    }}
                    onFocus={(e) => !project && (e.target.style.borderColor = '#0d6efd')}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.title}
                      </option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <small className="text-muted d-block mt-2">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      You don't have any projects yet. Create one first to send collaboration requests.
                    </small>
                  )}
                </div>

                {/* Role Section */}
                <div className="col-12 mt-4">
                  <h6 className="mb-3" style={{ color: '#0d6efd', fontWeight: '600', fontSize: '1rem' }}>
                    <i className="bi bi-person-badge me-2"></i>
                    Collaboration Details
                  </h6>
                </div>

                {/* Proposed Role */}
                <div className="col-12">
                  <label htmlFor="role" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                    <i className="bi bi-award me-1" style={{ color: '#0d6efd' }}></i>
                    Role Offering
                  </label>
                  <select
                    id="role"
                    className="form-select form-select-lg"
                    value={showOtherRole ? 'Other' : proposedRole}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Other') {
                        setShowOtherRole(true);
                        setProposedRole('');
                      } else {
                        setShowOtherRole(false);
                        setProposedRole(value);
                        setOtherRoleText('');
                      }
                    }}
                    style={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0d6efd'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  >
                    <option value="">Select a role...</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-2">
                    Specify what role you are offering to the collaborator (optional)
                  </small>
                </div>

                {/* Other Role Input - Show when "Other" is selected */}
                {showOtherRole && (
                  <div className="col-12">
                    <label htmlFor="otherRole" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                      <i className="bi bi-pencil me-1" style={{ color: '#0d6efd' }}></i>
                      Specify Other Role
                    </label>
                    <input
                      type="text"
                      id="otherRole"
                      className="form-control form-control-lg"
                      value={otherRoleText}
                      onChange={(e) => setOtherRoleText(e.target.value)}
                      placeholder="e.g., Field Research Coordinator, Grant Writer"
                      style={{ 
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0d6efd'}
                      onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    />
                  </div>
                )}

                {/* Message */}
                <div className="col-12">
                  <label htmlFor="message" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                    <i className="bi bi-chat-text me-1" style={{ color: '#0d6efd' }}></i>
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="message"
                    className="form-control form-control-lg"
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you'd like to collaborate on this project..."
                    maxLength="500"
                    required
                    style={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0d6efd'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  ></textarea>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Be clear and professional in your message
                    </small>
                    <small className={message.length > 450 ? 'text-danger fw-semibold' : 'text-muted'}>
                      {message.length}/500 characters
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              backgroundColor: 'var(--color-surface-2)', 
              borderTop: '1px solid var(--color-border)',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || projects.length === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Sending Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-1.5"></i>
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollaborateModal;
