import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const SendCollaborationRequest = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const [message, setMessage] = useState('');
  const [proposedRole, setProposedRole] = useState('');
  const [loading, setLoading] = useState(false);

  // Collaboration Workflow: 'request' (Request to Join Project) | 'invite' (Invite to My Project)
  const [collaborationMode, setCollaborationMode] = useState('request');

  // Selected Target User (Recipient)
  const [targetUser, setTargetUser] = useState(null);
  const [receiverUsername, setReceiverUsername] = useState('');

  // Unified User Search State (Invite mode)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Track initial setup to prevent redundant calls
  const initialSetupDone = useRef(false);

  // Helper to get user avatar URL
  const getAvatarUrl = (u) => {
    if (u?.profilePicture && u.profilePicture !== 'default-avatar.jpg') return u.profilePicture;
    const name = `${u?.firstName || 'User'} ${u?.lastName || ''}`.trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=96`;
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper: Fetch projects for a specific target researcher (for Request to Join mode)
  const fetchResearcherProjects = useCallback(async (researcherId, preselectedProject = null) => {
    if (!researcherId) return;
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects', {
        params: { owner: researcherId, limit: 100 }
      });
      const list = res.data?.data?.projects || res.data?.projects || res.data || [];
      const validProjects = Array.isArray(list) ? list : [];
      setProjects(validProjects);

      if (preselectedProject && validProjects.some(p => (p._id || p.id) === (preselectedProject._id || preselectedProject.id))) {
        const found = validProjects.find(p => (p._id || p.id) === (preselectedProject._id || preselectedProject.id));
        setSelectedProjectId(found._id || found.id);
        setSelectedProject(found);
      } else if (validProjects.length === 1) {
        // Exactly ONE project -> Automatically select and show it immediately
        setSelectedProjectId(validProjects[0]._id || validProjects[0].id);
        setSelectedProject(validProjects[0]);
      } else {
        // MULTIPLE or ZERO projects -> Do not auto-select
        setSelectedProjectId('');
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error fetching researcher projects:', error);
      toast.error('Failed to load researcher projects', { toastId: 'fetch-researcher-projects-error' });
      setProjects([]);
      setSelectedProjectId('');
      setSelectedProject(null);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Helper: Fetch current user's projects (for Invite to My Project mode)
  const fetchMyProjects = useCallback(async (preselectedProject = null) => {
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects/my');
      const list = res.data?.data?.projects || res.data?.projects || [];
      const validProjects = Array.isArray(list) ? list : [];
      setProjects(validProjects);

      if (preselectedProject && validProjects.some(p => (p._id || p.id) === (preselectedProject._id || preselectedProject.id))) {
        setSelectedProjectId(preselectedProject._id || preselectedProject.id);
        setSelectedProject(preselectedProject);
      } else if (validProjects.length === 1) {
        setSelectedProjectId(validProjects[0]._id || validProjects[0].id);
        setSelectedProject(validProjects[0]);
      } else {
        setSelectedProjectId('');
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error fetching my projects:', error);
      toast.error('Failed to load your projects', { toastId: 'fetch-my-projects-error' });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Helper: Fetch all open projects created by other researchers (for manual Request mode)
  const fetchAllProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const currentUserId = user?._id || user?.id;
      const res = await api.get('/projects', { params: { limit: 100 } });
      const list = res.data?.data?.projects || res.data?.projects || [];
      // Filter out user's own projects and projects not open for collaboration
      const otherProjects = (Array.isArray(list) ? list : []).filter(proj => {
        const ownerId = proj.owner?._id || proj.owner?.id || proj.owner;
        return ownerId !== currentUserId && proj.isOpenForCollaboration !== false;
      });
      setProjects(otherProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects', { toastId: 'fetch-all-projects-error' });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  // Initial load from navigation state or URL params
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (initialSetupDone.current) return;
    initialSetupDone.current = true;

    const navState = location.state || {};
    const passedTargetUser = navState.targetUser || navState.researcher || navState.user;
    const passedProject = navState.project;
    const currentUserId = user._id || user.id;

    if (passedTargetUser) {
      const targetId = passedTargetUser._id || passedTargetUser.id;
      setTargetUser(passedTargetUser);
      const username = passedTargetUser.username || '';
      setReceiverUsername(username);
      setSearchQuery(`${passedTargetUser.firstName || ''} ${passedTargetUser.lastName || ''}`.trim() || username);

      if (passedProject) {
        const isOwner = (passedProject.owner?._id || passedProject.owner?.id || passedProject.owner) === currentUserId;
        if (isOwner) {
          setCollaborationMode('invite');
          setMessage('I would like to invite you to collaborate on my project. Your expertise would be valuable, and I believe we can achieve great research outcomes together.');
          fetchMyProjects(passedProject);
        } else {
          setCollaborationMode('request');
          setMessage('I would like permission to collaborate on your project. I am very interested in this research domain and believe I can contribute meaningfully to the project objectives.');
          fetchResearcherProjects(targetId, passedProject);
        }
      } else {
        // Direct collaborate from researcher card -> Request to Join Project
        setCollaborationMode('request');
        setMessage('I would like permission to collaborate on your project. I am very interested in this research domain and believe I can contribute meaningfully to the project objectives.');
        fetchResearcherProjects(targetId);
      }
    } else if (passedProject) {
      const isOwner = (passedProject.owner?._id || passedProject.owner?.id || passedProject.owner) === currentUserId;
      setSelectedProject(passedProject);
      setSelectedProjectId(passedProject._id || passedProject.id);

      if (isOwner) {
        setCollaborationMode('invite');
        setMessage('I would like to invite you to collaborate on my project. Your expertise would be valuable, and I believe we can achieve great research outcomes together.');
        fetchMyProjects(passedProject);
      } else {
        setCollaborationMode('request');
        setMessage('I would like permission to collaborate on your project. I am very interested in this research domain and believe I can contribute meaningfully to the project objectives.');
        const projectOwner = passedProject.owner;
        if (projectOwner && typeof projectOwner === 'object') {
          setTargetUser(projectOwner);
          setReceiverUsername(projectOwner.username || '');
        }
        fetchAllProjects();
      }
    } else {
      // Default: Request to Join Project mode from Collaboration section
      setCollaborationMode('request');
      setMessage('I would like permission to collaborate on your project. I am very interested in this research domain and believe I can contribute meaningfully to the project objectives.');
      fetchAllProjects();
    }
  }, [user, location.state, navigate, fetchResearcherProjects, fetchMyProjects, fetchAllProjects]);

  // Workflow switcher handler
  const handleModeChange = (mode) => {
    setCollaborationMode(mode);
    setSelectedProjectId('');
    setSelectedProject(null);
    setShowDropdown(false);

    if (mode === 'invite') {
      setMessage('I would like to invite you to collaborate on my project. Your expertise would be valuable, and I believe we can achieve great research outcomes together.');
      if (!location.state?.targetUser) {
        setTargetUser(null);
        setReceiverUsername('');
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
      }
      fetchMyProjects();
    } else {
      setMessage('I would like permission to collaborate on your project. I am very interested in this research domain and believe I can contribute meaningfully to the project objectives.');
      if (targetUser && location.state?.targetUser) {
        fetchResearcherProjects(targetUser._id || targetUser.id);
      } else {
        setTargetUser(null);
        setReceiverUsername('');
        fetchAllProjects();
      }
    }
  };

  // Handle project selection change
  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);

    if (!projectId) {
      setSelectedProject(null);
      if (collaborationMode === 'request' && !location.state?.targetUser) {
        setTargetUser(null);
      }
      return;
    }

    const found = projects.find(p => (p._id || p.id) === projectId);
    setSelectedProject(found || null);

    // In Request to Join Project mode: Automatically resolve Project Owner as recipient
    if (collaborationMode === 'request' && found) {
      const ownerObj = typeof found.owner === 'object' ? found.owner : null;
      if (ownerObj) {
        setTargetUser(ownerObj);
        setReceiverUsername(ownerObj.username || '');
      }
    }
  };

  // Unified debounced user search query (Invite mode)
  useEffect(() => {
    if (collaborationMode !== 'invite') return;

    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    // If the input matches the currently selected target user, don't re-trigger search popup
    if (targetUser) {
      const currentTargetName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim().toLowerCase();
      const currentTargetUser = (targetUser.username || '').toLowerCase();
      const currentTargetEmail = (targetUser.email || '').toLowerCase();
      const qLower = trimmed.toLowerCase().replace(/^@+/, '');

      if (qLower === currentTargetName || qLower === currentTargetUser || qLower === currentTargetEmail) {
        return;
      }
    }

    setIsSearching(true);
    setHasSearched(false);

    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.get('/auth/search-users', {
          params: { q: trimmed }
        });
        const usersList = res.data?.data?.users || res.data?.users || [];
        setSearchResults(Array.isArray(usersList) ? usersList : []);
        setHasSearched(true);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, collaborationMode, targetUser]);

  // Handle user selection from search dropdown
  const handleSelectUser = (selected) => {
    setTargetUser(selected);
    setReceiverUsername(selected.username || '');
    setSearchQuery(`${selected.firstName || ''} ${selected.lastName || ''}`.trim() || selected.username || selected.email);
    setShowDropdown(false);
  };

  // Handle clearing the selected collaborator
  const handleClearSelectedUser = () => {
    setTargetUser(null);
    setReceiverUsername('');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setShowDropdown(false);
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

    // In Invite to My Project mode, validate collaborator was selected
    if (collaborationMode === 'invite') {
      if (!targetUser || !targetUser._id) {
        toast.error('Please search and select a valid collaborator to invite');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        projectId: selectedProjectId,
        message: message.trim(),
        proposedRole: proposedRole.trim() || 'Collaborator',
        collaborationType: collaborationMode
      };

      if (collaborationMode === 'invite') {
        // Send unique user ID and verified username
        payload.receiverId = targetUser._id || targetUser.id;
        payload.receiverUsername = (targetUser.username || '').replace(/^@+/, '').toLowerCase().trim();
      }

      const response = await api.post('/collaborations', payload);

      const successMsg = response.data?.message || (
        collaborationMode === 'invite'
          ? 'Collaboration invitation sent successfully!'
          : 'Collaboration request sent successfully to the project owner!'
      );

      toast.success(successMsg);
      navigate('/collaborations');
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      toast.error(error.response?.data?.message || 'Failed to send collaboration request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Active project owner for Request mode
  const activeProjectOwner = selectedProject?.owner || targetUser;
  const projectOwnerName = activeProjectOwner?.firstName && activeProjectOwner?.lastName
    ? `${activeProjectOwner.firstName} ${activeProjectOwner.lastName}`
    : activeProjectOwner?.name || activeProjectOwner?.username || 'Project Lead';

  const hasNoProjectsToJoin = collaborationMode === 'request' && location.state?.targetUser && !loadingProjects && projects.length === 0;

  // Determine if submit is disabled
  const isSubmitDisabled = loading || loadingProjects || !selectedProjectId || hasNoProjectsToJoin || !message.trim() || (collaborationMode === 'invite' && !targetUser);

  return (
    <div className="container section">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-8">
          {/* Back Navigation */}
          <div className="mb-3 mb-md-4">
            <Link to="/collaborations" className="btn btn-link text-decoration-none ps-0">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Collaborations
            </Link>
          </div>

          {/* Form Card */}
          <div className="card card-static shadow-sm">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#1e293b' }}>
                <i className={`bi bi-${collaborationMode === 'invite' ? 'envelope-plus-fill text-success' : 'handshake-fill text-primary'} me-2 fs-4`}></i>
                {collaborationMode === 'invite' ? 'Invite to My Project' : 'Request to Join Project'}
              </h5>
            </div>

            <div className="card-body p-3 p-md-4" style={{ backgroundColor: '#ffffff' }}>
              {/* Workflow Switcher */}
              <div className="mb-4">
                <label className="form-label fw-bold mb-3" style={{ color: '#212529', fontSize: '1.05rem' }}>
                  <i className="bi bi-toggles me-2 text-primary"></i>
                  Select Collaboration Workflow <span className="text-danger">*</span>
                </label>
                <div className="row g-3">
                  {/* Workflow 1: Request to Join Project */}
                  <div className="col-12 col-md-6">
                    <div
                      className={`card h-100 ${collaborationMode === 'request' ? 'border-primary' : ''}`}
                      onClick={() => handleModeChange('request')}
                      style={{
                        cursor: 'pointer',
                        borderWidth: collaborationMode === 'request' ? '2.5px' : '1.5px',
                        borderColor: collaborationMode === 'request' ? '#0d6efd' : '#dee2e6',
                        backgroundColor: collaborationMode === 'request' ? '#f0f7ff' : '#ffffff',
                        transition: 'all 0.2s',
                        borderRadius: '10px'
                      }}
                    >
                      <div className="card-body text-center p-3 p-md-4">
                        <div className="mb-2">
                          <i className="bi bi-hand-thumbs-up-fill" style={{
                            fontSize: '2.2rem',
                            color: collaborationMode === 'request' ? '#0d6efd' : '#94a3b8'
                          }}></i>
                        </div>
                        <h6 className="card-title mb-1 fw-bold" style={{
                          color: collaborationMode === 'request' ? '#0d6efd' : '#1e293b'
                        }}>
                          Request to Join Project
                        </h6>
                        <p className="card-text small mb-0 text-muted" style={{ lineHeight: '1.4' }}>
                          Select another user's project. The Project Owner is automatically resolved as recipient.
                        </p>
                        {collaborationMode === 'request' && (
                          <div className="mt-2">
                            <span className="badge bg-primary px-2.5 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Selected Workflow
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Workflow 2: Invite to My Project */}
                  <div className="col-12 col-md-6">
                    <div
                      className={`card h-100 ${collaborationMode === 'invite' ? 'border-success' : ''}`}
                      onClick={() => handleModeChange('invite')}
                      style={{
                        cursor: 'pointer',
                        borderWidth: collaborationMode === 'invite' ? '2.5px' : '1.5px',
                        borderColor: collaborationMode === 'invite' ? '#10b981' : '#dee2e6',
                        backgroundColor: collaborationMode === 'invite' ? '#ecfdf5' : '#ffffff',
                        transition: 'all 0.2s',
                        borderRadius: '10px'
                      }}
                    >
                      <div className="card-body text-center p-3 p-md-4">
                        <div className="mb-2">
                          <i className="bi bi-person-plus-fill" style={{
                            fontSize: '2.2rem',
                            color: collaborationMode === 'invite' ? '#10b981' : '#94a3b8'
                          }}></i>
                        </div>
                        <h6 className="card-title mb-1 fw-bold" style={{
                          color: collaborationMode === 'invite' ? '#10b981' : '#1e293b'
                        }}>
                          Invite to My Project
                        </h6>
                        <p className="card-text small mb-0 text-muted" style={{ lineHeight: '1.4' }}>
                          Select your project and search for a collaborator by name, username, or email.
                        </p>
                        {collaborationMode === 'invite' && (
                          <div className="mt-2">
                            <span className="badge bg-success px-2.5 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Selected Workflow
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Banner */}
              <div className={`alert ${collaborationMode === 'invite' ? 'alert-success' : 'alert-primary'} mb-4`} style={{
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.9rem'
              }}>
                <div className="d-flex align-items-center">
                  <i className={`bi bi-${collaborationMode === 'invite' ? 'envelope-check-fill' : 'shield-check'} me-2 fs-5`}></i>
                  <div>
                    <strong>
                      {collaborationMode === 'invite'
                        ? 'Invite to My Project: Select one of your projects and search for any researcher by first name, last name, full name, username, or email.'
                        : 'Request to Join Project: Select a project to join. The Project Owner is automatically set as recipient (no username entry required).'}
                    </strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3 g-md-4">
                  {/* Step 1: Project Selection */}
                  <div className="col-12">
                    <label htmlFor="project-select" className="form-label fw-bold" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                      <i className="bi bi-folder-fill me-1 text-primary"></i>
                      {collaborationMode === 'invite' ? 'Select Your Project' : 'Select Project to Join'} <span className="text-danger">*</span>
                    </label>
                    <select
                      id="project-select"
                      className="form-select form-select-lg"
                      value={selectedProjectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      required
                      disabled={loadingProjects || hasNoProjectsToJoin || (!!location.state?.project && collaborationMode === 'request')}
                      style={{
                        backgroundColor: (loadingProjects || hasNoProjectsToJoin || (!!location.state?.project && collaborationMode === 'request')) ? '#f8fafc' : '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    >
                      <option value="">
                        {loadingProjects
                          ? 'Loading projects...'
                          : hasNoProjectsToJoin
                            ? 'No projects available to join'
                            : collaborationMode === 'invite'
                              ? 'Choose your project to invite them to...'
                              : 'Choose a project you want to join...'}
                      </option>
                      {projects.map((proj) => {
                        const ownerDisplay = proj.owner?.firstName ? ` — Lead: ${proj.owner.firstName} ${proj.owner.lastName}` : '';
                        return (
                          <option key={proj._id || proj.id} value={proj._id || proj.id}>
                            {proj.title}{collaborationMode === 'request' ? ownerDisplay : ''}
                          </option>
                        );
                      })}
                    </select>

                    {/* Loading State */}
                    {loadingProjects && (
                      <div className="text-muted small mt-2">
                        <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                        Loading available projects...
                      </div>
                    )}

                    {/* Empty State: Target Researcher has NO projects */}
                    {hasNoProjectsToJoin && (
                      <div className="alert alert-warning mt-2 mb-0 py-2 px-3 d-flex align-items-center" style={{ fontSize: '0.875rem', borderRadius: '8px' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                        <span>This researcher currently has no projects available to join.</span>
                      </div>
                    )}

                    {/* Empty State: User has NO projects in Invite mode */}
                    {!loadingProjects && projects.length === 0 && collaborationMode === 'invite' && (
                      <div className="alert alert-warning mt-2 mb-0 py-2 px-3 d-flex align-items-center" style={{ fontSize: '0.875rem', borderRadius: '8px' }}>
                        <i className="bi bi-exclamation-circle-fill me-2 text-warning"></i>
                        <span>You do not have any projects yet. <Link to="/projects/create" className="alert-link ms-1">Create a project first</Link> to invite collaborators.</span>
                      </div>
                    )}

                    {/* Empty State: General Request mode no projects */}
                    {!loadingProjects && projects.length === 0 && collaborationMode === 'request' && !location.state?.targetUser && (
                      <div className="text-muted small mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        No active projects currently open for collaboration.
                      </div>
                    )}
                  </div>

                  {/* Step 2: Auto-Resolved Project Owner (Request to Join Project Workflow) */}
                  {collaborationMode === 'request' && (
                    <div className="col-12">
                      <label className="form-label fw-bold mb-2" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                        <i className="bi bi-person-check-fill me-1 text-primary"></i>
                        Project Owner (Auto-Resolved Recipient)
                      </label>

                      {selectedProject && activeProjectOwner ? (
                        <div className="p-3 border rounded-3 bg-light shadow-sm" style={{ borderLeft: '4px solid #0d6efd', backgroundColor: '#f8fafc' }}>
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={getAvatarUrl(activeProjectOwner)}
                                alt="Project Owner"
                                className="rounded-circle shadow-sm"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', border: '2px solid #0d6efd' }}
                              />
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                                    {projectOwnerName}
                                  </span>
                                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.75rem' }}>
                                    Project Owner
                                  </span>
                                </div>
                                <div className="text-muted small mt-0.5">
                                  {activeProjectOwner.username && (
                                    <span className="fw-semibold text-primary me-2">@{activeProjectOwner.username}</span>
                                  )}
                                  {activeProjectOwner.institution && (
                                    <span>• {activeProjectOwner.institution}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-shield-check me-1"></i>
                                Recipient Auto-Resolved
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 border rounded-3 text-muted small bg-light text-center">
                          <i className="bi bi-arrow-up-circle me-1 text-primary"></i>
                          Select a project above to automatically identify and assign the project owner as the recipient.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Unified Collaborator Search (Invite to My Project Workflow) */}
                  {collaborationMode === 'invite' && (
                    <div className="col-12" ref={searchContainerRef}>
                      <label htmlFor="collaborator-search-input" className="form-label fw-bold" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                        <i className="bi bi-search me-1 text-success"></i>
                        Search Collaborator to Invite <span className="text-danger">*</span>
                      </label>

                      {/* Selected Collaborator Confirmation Card */}
                      {targetUser ? (
                        <div className="p-3 border rounded-3 bg-light shadow-sm mb-2" style={{ borderLeft: '4px solid #10b981', backgroundColor: '#f0fdf4' }}>
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={getAvatarUrl(targetUser)}
                                alt="Selected Invitee"
                                className="rounded-circle shadow-sm"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', border: '2px solid #10b981' }}
                              />
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                                    {targetUser.firstName} {targetUser.lastName}
                                  </span>
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.75rem' }}>
                                    Selected Invitee
                                  </span>
                                </div>
                                <div className="text-muted small mt-0.5">
                                  {targetUser.username && (
                                    <span className="fw-semibold text-success me-2">@{targetUser.username}</span>
                                  )}
                                  {targetUser.email && (
                                    <span className="text-secondary me-2">• {targetUser.email}</span>
                                  )}
                                  {targetUser.institution && (
                                    <span>• {targetUser.institution}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={handleClearSelectedUser}
                              style={{ borderRadius: '6px' }}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i>
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Search Input Box with Real-time Floating Dropdown */
                        <div className="position-relative">
                          <div className="input-group input-group-lg">
                            <span className="input-group-text bg-white border-end-0" style={{ border: '1.5px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                              <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                              type="text"
                              id="collaborator-search-input"
                              className="form-control form-control-lg border-start-0"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!showDropdown) setShowDropdown(true);
                              }}
                              onFocus={() => {
                                if (searchQuery.trim().length >= 1) setShowDropdown(true);
                              }}
                              placeholder="Search by first name, last name, full name, username (@alice), or email..."
                              style={{
                                border: '1.5px solid #cbd5e1',
                                borderLeft: 'none',
                                borderRadius: '0 8px 8px 0',
                                fontSize: '0.95rem'
                              }}
                            />
                            {isSearching && (
                              <span className="position-absolute end-0 top-50 translate-middle-y me-3" style={{ zIndex: 10 }}>
                                <div className="spinner-border spinner-border-sm text-success" role="status">
                                  <span className="visually-hidden">Searching...</span>
                                </div>
                              </span>
                            )}
                          </div>

                          <small className="text-muted d-block mt-1.5">
                            <i className="bi bi-info-circle me-1"></i>
                            Type at least 1 character to search researchers across the university database.
                          </small>

                          {/* Floating Search Results Dropdown */}
                          {showDropdown && searchQuery.trim().length >= 1 && (
                            <div
                              className="position-absolute w-100 bg-white shadow-lg border rounded-3 mt-1 overflow-hidden"
                              style={{
                                zIndex: 1050,
                                maxHeight: '280px',
                                overflowY: 'auto'
                              }}
                            >
                              {isSearching ? (
                                <div className="p-3 text-center text-muted small">
                                  <span className="spinner-border spinner-border-sm me-2 text-success" role="status"></span>
                                  Searching database...
                                </div>
                              ) : searchResults.length > 0 ? (
                                <div className="list-group list-group-flush">
                                  {searchResults.map((u) => (
                                    <div
                                      key={u._id || u.id}
                                      className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-2.5 cursor-pointer"
                                      onClick={() => handleSelectUser(u)}
                                      style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                    >
                                      <div className="d-flex align-items-center gap-2.5">
                                        <img
                                          src={getAvatarUrl(u)}
                                          alt="User Avatar"
                                          className="rounded-circle"
                                          style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                                        />
                                        <div>
                                          <div className="fw-semibold text-dark" style={{ fontSize: '0.92rem' }}>
                                            {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                                            {u.username && (
                                              <span className="badge bg-success bg-opacity-10 text-success ms-2 font-monospace" style={{ fontSize: '0.75rem' }}>
                                                @{u.username}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                                            <span>{u.email}</span>
                                            {u.institution && <span className="ms-1.5">• {u.institution}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="btn btn-outline-success btn-sm py-1 px-2.5" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
                                          Select
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : hasSearched ? (
                                <div className="p-3 text-center text-muted small">
                                  <i className="bi bi-person-x me-1 text-danger"></i>
                                  No user found matching "<strong>{searchQuery.trim()}</strong>"
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Role Field */}
                  <div className="col-12">
                    <label htmlFor="role-input" className="form-label fw-bold" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                      <i className="bi bi-award me-1 text-primary"></i>
                      {collaborationMode === 'invite' ? 'Role Offered to Collaborator (Optional)' : 'Proposed Role (Optional)'}
                    </label>
                    <input
                      type="text"
                      id="role-input"
                      className="form-control form-control-lg"
                      value={proposedRole}
                      onChange={(e) => setProposedRole(e.target.value)}
                      placeholder={collaborationMode === 'invite'
                        ? "e.g., Co-Investigator, Research Assistant, Technical Advisor"
                        : "e.g., Co-Researcher, Data Analyst, Domain Specialist"}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  {/* Step 4: Message Field */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="message-textarea" className="form-label fw-bold mb-0" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
                        <i className="bi bi-chat-text-fill me-1 text-primary"></i>
                        {collaborationMode === 'invite' ? 'Invitation Message' : 'Request Message'} <span className="text-danger">*</span>
                      </label>
                      <small className={message.length > 450 ? 'text-danger fw-semibold' : 'text-muted'}>
                        {message.length}/500
                      </small>
                    </div>
                    <textarea
                      id="message-textarea"
                      className="form-control form-control-lg"
                      rows="5"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={collaborationMode === 'invite'
                        ? "Explain the project scope and why you'd like this researcher to join your team..."
                        : "Introduce your research background and how you plan to contribute to this project..."}
                      maxLength="500"
                      required
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    ></textarea>
                  </div>

                  {/* Actions */}
                  <div className="col-12 mt-4">
                    <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                      <button
                        type="button"
                        className="btn btn-light btn-lg px-4 order-2 order-sm-1 border"
                        onClick={() => navigate('/collaborations')}
                        disabled={loading}
                        style={{ borderRadius: '8px', fontWeight: '600' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg px-4 flex-grow-1 order-1 order-sm-2"
                        disabled={isSubmitDisabled}
                        style={{
                          borderRadius: '8px',
                          fontWeight: '600',
                          backgroundColor: isSubmitDisabled ? '#94a3b8' : (collaborationMode === 'invite' ? '#10b981' : '#0d6efd'),
                          borderColor: isSubmitDisabled ? '#94a3b8' : (collaborationMode === 'invite' ? '#10b981' : '#0d6efd')
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className={`bi bi-${collaborationMode === 'invite' ? 'send-check-fill' : 'send-fill'} me-2`}></i>
                            {collaborationMode === 'invite' ? 'Send Project Invitation' : 'Send Request to Join Project'}
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
  );
};

export default SendCollaborationRequest;
