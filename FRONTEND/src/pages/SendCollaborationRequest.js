import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const SendCollaborationRequest = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [proposedRole, setProposedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [collaborationMode, setCollaborationMode] = useState('request'); // 'invite' or 'request'
  const [selectedProject, setSelectedProject] = useState(null);
  const [receiverUsername, setReceiverUsername] = useState('');
  const [usernameValidation, setUsernameValidation] = useState({ checking: false, valid: false, error: '', user: null });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Get data from navigation state
    if (location.state?.project) {
      setSelectedProjectId(location.state.project._id);
      setTargetUser(location.state.targetUser);
      setSelectedProject(location.state.project);
      
      // Determine mode based on project ownership
      if (location.state.project.owner?._id === user.id || location.state.project.owner === user.id) {
        setCollaborationMode('invite');
        setMessage('I would like to invite you to collaborate on my project. Your expertise would be valuable, and I believe we can create something impactful together.');
      } else {
        setCollaborationMode('request');
        setMessage('I would like permission to collaborate on your project. I am very interested in this research area and believe I can contribute meaningfully to the project goals.');
      }
    }

    fetchMyProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.state]);

  const fetchMyProjects = async () => {
    try {
      const response = await api.get('/projects/my');
      setProjects(response.data.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load your projects');
    }
  };

  const fetchAllProjects = async () => {
    try {
      const response = await api.get('/projects');
      // Filter out projects the user owns
      const otherProjects = (response.data.data.projects || []).filter(
        proj => proj.owner?._id !== user.id && proj.owner !== user.id
      );
      setProjects(otherProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  // Validate username with debounce
  const validateUsername = async (username) => {
    if (!username || username.trim().length < 3) {
      setUsernameValidation({ checking: false, valid: false, error: '', user: null });
      return;
    }

    // Remove @ symbol if user added it
    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    
    setUsernameValidation({ checking: true, valid: false, error: '', user: null });

    try {
      const response = await api.get(`/auth/user/${cleanUsername}`);
      const foundUser = response.data.data.user;

      // Check if user is trying to collaborate with themselves
      if (foundUser._id === user.id) {
        setUsernameValidation({ 
          checking: false, 
          valid: false, 
          error: 'You cannot send a collaboration request to yourself', 
          user: null 
        });
        return;
      }

      setUsernameValidation({ 
        checking: false, 
        valid: true, 
        error: '', 
        user: foundUser 
      });
      setTargetUser(foundUser);
      toast.success(`User @${foundUser.username} found!`);
    } catch (error) {
      setUsernameValidation({ 
        checking: false, 
        valid: false, 
        error: error.response?.data?.message || 'User not found with this username', 
        user: null 
      });
      setTargetUser(null);
    }
  };

  // Debounced username validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (receiverUsername && receiverUsername.trim().length >= 3) {
        validateUsername(receiverUsername);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverUsername]);

  // Fetch projects based on collaboration mode
  useEffect(() => {
    if (user) {
      if (collaborationMode === 'invite') {
        fetchMyProjects();
      } else {
        fetchAllProjects();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborationMode, user]);

  // Handle project selection change
  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
    
    if (!projectId) {
      setSelectedProject(null);
      return;
    }

    // Find the selected project
    const project = projects.find(p => p._id === projectId);
    setSelectedProject(project);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (!receiverUsername || receiverUsername.trim().length < 3) {
      toast.error('Please enter a valid username (at least 3 characters)');
      return;
    }

    if (!usernameValidation.valid) {
      toast.error('Please enter a valid username that exists in the system');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!targetUser) {
      toast.error('Target user not specified');
      return;
    }

    try {
      setLoading(true);
      
      // Determine receiver based on collaboration mode
      let receiverId;
      if (collaborationMode === 'invite') {
        // Inviting someone to my project - receiver is the target user
        receiverId = targetUser._id || targetUser.id || targetUser;
      } else {
        // Requesting to join their project - receiver is the project owner
        if (selectedProject) {
          receiverId = selectedProject.owner?._id || selectedProject.owner?.id || selectedProject.owner;
        } else {
          receiverId = targetUser._id || targetUser.id || targetUser;
        }
      }

      // Check for duplicate collaboration request
      try {
        const existingResponse = await api.get('/collaborations', {
          params: {
            projectId: selectedProjectId,
            receiverId: receiverId
          }
        });
        
        const existingCollabs = existingResponse.data.data.collaborations || [];
        const duplicateFound = existingCollabs.some(collab => 
          (collab.project?._id === selectedProjectId || collab.project === selectedProjectId) &&
          (collab.receiver?._id === receiverId || collab.receiver === receiverId) &&
          collab.status === 'Pending'
        );

        if (duplicateFound) {
          toast.warning('You have already sent a collaboration request for this project to this user');
          setLoading(false);
          return;
        }
      } catch (checkError) {
        console.log('Could not check for duplicates:', checkError);
        // Continue anyway - backend will handle duplicates
      }

      await api.post('/collaborations', {
        receiverId: receiverId,
        receiverUsername: receiverUsername.replace('@', '').toLowerCase().trim(),
        projectId: selectedProjectId,
        message: message.trim(),
        proposedRole: proposedRole || 'Collaborator',
        collaborationType: collaborationMode // 'invite' or 'request'
      });

      const successMessage = collaborationMode === 'invite' 
        ? 'Collaboration invitation sent successfully!' 
        : 'Collaboration request sent successfully!';
      
      toast.success(successMessage);
      navigate('/collaborations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send collaboration request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const userName = targetUser?.firstName && targetUser?.lastName 
    ? `${targetUser.firstName} ${targetUser.lastName}`
    : targetUser?.name || 'this user';

  return (
    <div className="bg-light min-h-screen py-4 py-md-8">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            {/* Header */}
            <div className="mb-3 mb-md-4">
              <Link to="/projects" className="btn btn-link text-decoration-none ps-0">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Projects
              </Link>
            </div>

            {/* Form Card */}
            <div className="card shadow-sm" style={{ 
              border: '2px solid #dee2e6',
              borderRadius: '0.5rem'
            }}>
              <div className="card-header" style={{
                background: collaborationMode === 'invite' 
                  ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                  : 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)',
                border: 'none',
                padding: '16px 20px',
                color: 'white'
              }}>
                <h3 className="mb-0" style={{ fontWeight: '700', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
                  <i className={`bi bi-${collaborationMode === 'invite' ? 'person-plus-fill' : 'handshake'} me-2`}></i>
                  {collaborationMode === 'invite' ? 'Invite to Collaborate' : 'Request to Collaborate'}
                </h3>
              </div>

              <div className="card-body p-3 p-md-4" style={{ backgroundColor: '#ffffff' }}>
                {/* Request Type Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold mb-3" style={{ color: '#212529', fontSize: '1.1rem' }}>
                    <i className="bi bi-toggles me-2" style={{ color: '#6f42c1' }}></i>
                    Select Request Type <span className="text-danger">*</span>
                  </label>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div 
                        className={`card h-100 cursor-pointer ${collaborationMode === 'request' ? 'border-primary' : ''}`}
                        onClick={() => {
                          setCollaborationMode('request');
                          setMessage('I would like permission to collaborate on your project. I am very interested in this research area and believe I can contribute meaningfully to the project goals.');
                          setSelectedProjectId('');
                          setSelectedProject(null);
                        }}
                        style={{
                          cursor: 'pointer',
                          borderWidth: collaborationMode === 'request' ? '3px' : '2px',
                          borderColor: collaborationMode === 'request' ? '#0d6efd' : '#dee2e6',
                          backgroundColor: collaborationMode === 'request' ? '#e7f1ff' : '#ffffff',
                          transition: 'all 0.2s',
                          borderRadius: '10px'
                        }}
                        onMouseEnter={(e) => {
                          if (collaborationMode !== 'request') {
                            e.currentTarget.style.borderColor = '#0d6efd';
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (collaborationMode !== 'request') {
                            e.currentTarget.style.borderColor = '#dee2e6';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        <div className="card-body text-center p-3 p-md-4">
                          <div className="mb-3">
                            <i className="bi bi-hand-thumbs-up-fill" style={{ 
                              fontSize: '2.5rem', 
                              color: collaborationMode === 'request' ? '#0d6efd' : '#6c757d'
                            }}></i>
                          </div>
                          <h5 className="card-title mb-2" style={{ 
                            fontWeight: '700',
                            color: collaborationMode === 'request' ? '#0d6efd' : '#212529'
                          }}>
                            Request to Join
                          </h5>
                          <p className="card-text small mb-0" style={{ 
                            color: collaborationMode === 'request' ? '#084298' : '#6c757d',
                            lineHeight: '1.5'
                          }}>
                            You are asking to join someone else's project
                          </p>
                          {collaborationMode === 'request' && (
                            <div className="mt-3">
                              <span className="badge bg-primary px-3 py-2">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div 
                        className={`card h-100 cursor-pointer ${collaborationMode === 'invite' ? 'border-success' : ''}`}
                        onClick={() => {
                          setCollaborationMode('invite');
                          setMessage('I would like to invite you to collaborate on my project. Your expertise would be valuable, and I believe we can create something impactful together.');
                          setSelectedProjectId('');
                          setSelectedProject(null);
                        }}
                        style={{
                          cursor: 'pointer',
                          borderWidth: collaborationMode === 'invite' ? '3px' : '2px',
                          borderColor: collaborationMode === 'invite' ? '#28a745' : '#dee2e6',
                          backgroundColor: collaborationMode === 'invite' ? '#d4edda' : '#ffffff',
                          transition: 'all 0.2s',
                          borderRadius: '10px'
                        }}
                        onMouseEnter={(e) => {
                          if (collaborationMode !== 'invite') {
                            e.currentTarget.style.borderColor = '#28a745';
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (collaborationMode !== 'invite') {
                            e.currentTarget.style.borderColor = '#dee2e6';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        <div className="card-body text-center p-3 p-md-4">
                          <div className="mb-3">
                            <i className="bi bi-person-plus-fill" style={{ 
                              fontSize: '2.5rem', 
                              color: collaborationMode === 'invite' ? '#28a745' : '#6c757d'
                            }}></i>
                          </div>
                          <h5 className="card-title mb-2" style={{ 
                            fontWeight: '700',
                            color: collaborationMode === 'invite' ? '#28a745' : '#212529'
                          }}>
                            Invite to My Project
                          </h5>
                          <p className="card-text small mb-0" style={{ 
                            color: collaborationMode === 'invite' ? '#0f5132' : '#6c757d',
                            lineHeight: '1.5'
                          }}>
                            You are inviting someone to work on your project
                          </p>
                          {collaborationMode === 'invite' && (
                            <div className="mt-3">
                              <span className="badge bg-success px-3 py-2">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode Indicator */}
                <div className={`alert ${collaborationMode === 'invite' ? 'alert-success' : 'alert-primary'} mb-3 mb-md-4`} style={{
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
                }}>
                  <div className="d-flex align-items-start">
                    <i className={`bi bi-${collaborationMode === 'invite' ? 'person-check-fill' : 'hand-thumbs-up-fill'} me-2 mt-1`} 
                       style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
                    <div>
                      <strong className="d-block">
                        {collaborationMode === 'invite' 
                          ? 'Invitation Mode: You are inviting someone to join your project' 
                          : 'Request Mode: You are asking to join someone else\'s project'}
                      </strong>
                      {targetUser && (
                        <div className="mt-1">
                          <small>
                            {collaborationMode === 'invite' 
                              ? `Inviting: ${userName}` 
                              : `Requesting from: ${userName}`}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 g-md-4">
                    {/* Project Selection Section */}
                    <div className="col-12">
                      <h6 className="mb-2 mb-md-3" style={{ color: '#0d6efd', fontWeight: '600', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        <i className="bi bi-folder me-2"></i>
                        Project Information
                      </h6>
                    </div>

                    {/* Select Project */}
                    <div className="col-12">
                      <label htmlFor="project" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-briefcase me-1" style={{ color: collaborationMode === 'invite' ? '#28a745' : '#0d6efd' }}></i>
                        {collaborationMode === 'invite' ? 'Select Your Project' : 'Select Project to Join'} <span className="text-danger">*</span>
                      </label>
                      <select
                        id="project"
                        className="form-select form-select-lg"
                        value={selectedProjectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        required
                        disabled={!!location.state?.project}
                        style={{ 
                          backgroundColor: location.state?.project ? '#f8f9fa' : '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          cursor: location.state?.project ? 'not-allowed' : 'pointer'
                        }}
                        onFocus={(e) => !location.state?.project && (e.target.style.borderColor = collaborationMode === 'invite' ? '#28a745' : '#0d6efd')}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      >
                        <option value="">
                          {collaborationMode === 'invite' 
                            ? 'Choose your project to invite them to...' 
                            : 'Choose a project you want to join...'}
                        </option>
                        {projects.map((proj) => (
                          <option key={proj._id} value={proj._id}>
                            {proj.title}
                            {collaborationMode === 'request' && proj.owner?.firstName && ` (by ${proj.owner.firstName} ${proj.owner.lastName})`}
                          </option>
                        ))}
                      </select>
                      {projects.length === 0 && (
                        <small className="text-muted d-block mt-2">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          {collaborationMode === 'invite' 
                            ? <>You don't have any projects yet. <Link to="/projects/create">Create one first</Link>.</>
                            : 'No available projects to join at the moment.'}
                        </small>
                      )}
                      {selectedProject && (
                        <small className="d-block mt-2" style={{ 
                          color: collaborationMode === 'invite' ? '#28a745' : '#0d6efd',
                          fontWeight: '500'
                        }}>
                          <i className={`bi bi-${collaborationMode === 'invite' ? 'check-circle-fill' : 'info-circle-fill'} me-1`}></i>
                          {collaborationMode === 'invite' 
                            ? 'You will invite a collaborator to join this project' 
                            : `Requesting to join: ${selectedProject.title}`}
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

                    {/* Receiver Username */}
                    <div className="col-12">
                      <label htmlFor="username" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-at me-1" style={{ color: collaborationMode === 'invite' ? '#28a745' : '#0d6efd' }}></i>
                        Collaborator Username <span className="text-danger">*</span>
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          id="username"
                          className={`form-control form-control-lg ${usernameValidation.valid ? 'is-valid' : usernameValidation.error ? 'is-invalid' : ''}`}
                          value={receiverUsername}
                          onChange={(e) => setReceiverUsername(e.target.value)}
                          placeholder="e.g., john_doe or @john_doe"
                          required
                          style={{ 
                            backgroundColor: '#ffffff',
                            border: `2px solid ${usernameValidation.valid ? '#28a745' : usernameValidation.error ? '#dc3545' : '#dee2e6'}`,
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            paddingLeft: '40px'
                          }}
                          onFocus={(e) => !usernameValidation.valid && !usernameValidation.error && (e.target.style.borderColor = collaborationMode === 'invite' ? '#28a745' : '#0d6efd')}
                          onBlur={(e) => !usernameValidation.valid && !usernameValidation.error && (e.target.style.borderColor = '#dee2e6')}
                        />
                        <span style={{
                          position: 'absolute',
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          fontSize: '1.1rem',
                          fontWeight: '600'
                        }}>@</span>
                        {usernameValidation.checking && (
                          <span className="position-absolute end-0 top-50 translate-middle-y me-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </span>
                        )}
                      </div>
                      {usernameValidation.valid && usernameValidation.user && (
                        <div className="alert alert-success mt-2 py-2 px-3" style={{ fontSize: '0.875rem' }}>
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <strong>Found:</strong> {usernameValidation.user.firstName} {usernameValidation.user.lastName} 
                          {usernameValidation.user.institution && ` from ${usernameValidation.user.institution}`}
                        </div>
                      )}
                      {usernameValidation.error && (
                        <div className="alert alert-danger mt-2 py-2 px-3" style={{ fontSize: '0.875rem' }}>
                          <i className="bi bi-exclamation-circle-fill me-2"></i>
                          {usernameValidation.error}
                        </div>
                      )}
                      <small className="text-muted d-block mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Enter the unique username of the person you want to collaborate with (similar to Instagram's @handle)
                      </small>
                    </div>

                    {/* Proposed Role */}
                    <div className="col-12">
                      <label htmlFor="role" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-award me-1" style={{ color: collaborationMode === 'invite' ? '#28a745' : '#0d6efd' }}></i>
                        {collaborationMode === 'invite' ? 'Role Offering' : 'Proposed Role'}
                      </label>
                      <input
                        type="text"
                        id="role"
                        className="form-control form-control-lg"
                        value={proposedRole}
                        onChange={(e) => setProposedRole(e.target.value)}
                        placeholder={collaborationMode === 'invite' 
                          ? "e.g., Research Associate, Data Analyst, Co-Investigator" 
                          : "e.g., Co-Researcher, Data Analyst, Technical Lead"}
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = collaborationMode === 'invite' ? '#28a745' : '#0d6efd'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      />
                      <small className="text-muted d-block mt-2">
                        {collaborationMode === 'invite' 
                          ? 'Specify what role you are offering to the collaborator (optional)' 
                          : 'Suggest a role for this collaboration (optional)'}
                      </small>
                    </div>

                    {/* Message */}
                    <div className="col-12">
                      <label htmlFor="message" className="form-label fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-chat-text me-1" style={{ color: collaborationMode === 'invite' ? '#28a745' : '#0d6efd' }}></i>
                        {collaborationMode === 'invite' ? 'Invitation Message' : 'Request Message'} <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="message"
                        className="form-control form-control-lg"
                        rows="6"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={collaborationMode === 'invite' 
                          ? "Explain why you'd like this person to join your project and what they would contribute..." 
                          : "Introduce yourself and explain why you'd like to collaborate on this project..."}
                        maxLength="500"
                        required
                        style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          resize: 'vertical'
                        }}
                        onFocus={(e) => e.target.style.borderColor = collaborationMode === 'invite' ? '#28a745' : '#0d6efd'}
                        onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                      ></textarea>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          {collaborationMode === 'invite' 
                            ? 'Explain the project goals and how they can contribute' 
                            : 'Be clear and professional in your message'}
                        </small>
                        <small className={message.length > 450 ? 'text-danger fw-semibold' : 'text-muted'}>
                          {message.length}/500 characters
                        </small>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="col-12 mt-3 mt-md-4">
                      <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                        <button
                          type="button"
                          className="btn btn-lg px-4 order-2 order-sm-1"
                          onClick={() => navigate('/projects')}
                          disabled={loading}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-lg px-4 flex-grow-1 order-1 order-sm-2"
                          disabled={loading || projects.length === 0}
                          style={{
                            background: loading ? '#6c757d' : (collaborationMode === 'invite' 
                              ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                              : 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)'),
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            opacity: (loading || projects.length === 0) ? '0.6' : '1',
                            cursor: (loading || projects.length === 0) ? 'not-allowed' : 'pointer',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                          }}
                          onMouseEnter={(e) => {
                            if (!loading && projects.length > 0) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = collaborationMode === 'invite'
                                ? '0 4px 12px rgba(40, 167, 69, 0.4)'
                                : '0 4px 12px rgba(13, 110, 253, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              <span className="d-none d-sm-inline">Sending {collaborationMode === 'invite' ? 'Invitation' : 'Request'}...</span>
                              <span className="d-sm-none">Sending...</span>
                            </>
                          ) : (
                            <>
                              <i className={`bi bi-${collaborationMode === 'invite' ? 'envelope-check-fill' : 'send-fill'} me-2`}></i>
                              {collaborationMode === 'invite' ? 'Send Invitation' : 'Send Request'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCollaborationRequest;
