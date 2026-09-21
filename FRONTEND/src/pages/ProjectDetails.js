import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import FileUpload from '../components/FileUpload';
import FileTreeView from '../components/FileTreeView';
import { API_BASE_URL } from '../services/api';
import { joinProjectRoom, leaveProjectRoom, getSocket } from '../services/socket';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchComments();

    // Join real-time project room
    joinProjectRoom(id);

    const socket = getSocket();
    if (socket) {
      const handleRealtimeComment = (comment) => {
        setComments((prev) => [comment, ...prev]);
      };
      socket.on('new_comment', handleRealtimeComment);

      return () => {
        socket.off('new_comment', handleRealtimeComment);
        leaveProjectRoom(id);
      };
    }

    return () => {
      leaveProjectRoom(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/projects/${id}/comments`);
      setComments(res.data?.data?.comments || []);
    } catch {
      // Ignore
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/projects/${id}/comments`, { text: newCommentText.trim() });
      setNewCommentText('');
      fetchComments();
      toast.success('Comment posted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      console.log('Project data received:', response.data);
      setProject(response.data.data.project);
      
      // Fetch verification requests if user is logged in
      if (user) {
        await fetchVerificationRequests();
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error(error.response?.data?.message || 'Failed to load project details');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'Planning': 'bg-warning',
      'In Progress': 'bg-primary',
      'Completed': 'bg-success',
      'On Hold': 'bg-secondary',
      'Cancelled': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDownload = (attachment) => {
    const downloadUrl = `${API_BASE_URL}${attachment.url}`;
    window.open(downloadUrl, '_blank');
    toast.success(`Downloading: ${attachment.filename}`);
  };

  const getFileExtension = (filename = '') => {
    return filename.split('.').pop().toLowerCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename = '') => {
    const ext = getFileExtension(filename);
    const iconMap = {
      pdf: 'bi-file-pdf',
      doc: 'bi-file-word',
      docx: 'bi-file-word',
      xls: 'bi-file-excel',
      xlsx: 'bi-file-excel',
      ppt: 'bi-file-ppt',
      pptx: 'bi-file-ppt',
      zip: 'bi-file-zip',
      rar: 'bi-file-zip',
      jpg: 'bi-file-image',
      jpeg: 'bi-file-image',
      png: 'bi-file-image',
      gif: 'bi-file-image',
      txt: 'bi-file-text',
      md: 'bi-markdown',
      csv: 'bi-file-spreadsheet',
      json: 'bi-file-code',
      js: 'bi-file-code',
      html: 'bi-file-code',
      css: 'bi-file-code',
      py: 'bi-file-code',
      java: 'bi-file-code'
    };
    return iconMap[ext] || 'bi-file-earmark-text';
  };

  const handlePreview = (attachment) => {
    setPreviewFile(attachment);
    setShowPreviewModal(true);
  };

  const renderPreview = () => {
    if (!previewFile) return null;

    const filename = previewFile.filename || previewFile.name || 'file';
    const ext = getFileExtension(filename);
    const fileUrl = `${API_BASE_URL}${previewFile.url}`;

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return (
        <div style={{ background: '#0f172a', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={fileUrl}
            alt={filename}
            style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      );
    }

    return (
      <div style={{ background: '#ffffff', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        {/* File Icon Badge */}
        <div
          style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.12)'
          }}
        >
          <i className={`bi ${getFileIcon(filename)}`} style={{ fontSize: '2.5rem', color: '#4f46e5' }}></i>
        </div>

        {/* Filename & Type */}
        <h6 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.4rem' }}>
          {filename}
        </h6>
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
          <span
            style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            {ext}
          </span>
          {previewFile.fileSize && (
            <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
              {formatFileSize(previewFile.fileSize)}
            </span>
          )}
          {previewFile.uploadedAt && (
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              • {new Date(previewFile.uploadedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Information Text Box */}
        <div
          style={{
            maxWidth: '430px',
            margin: '0 auto 1.5rem',
            padding: '0.85rem 1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            color: '#475569',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
        >
          <i className="bi bi-info-circle me-1" style={{ color: '#4f46e5' }}></i>{' '}
          Inline preview is not available for this file type. You can securely download this file to view its full content.
        </div>

        {/* Direct Download Button */}
        <button
          type="button"
          className="btn"
          onClick={() => handleDownload(previewFile)}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.65rem 1.6rem',
            fontWeight: '600',
            fontSize: '0.925rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.28)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(79, 70, 229, 0.38)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.28)';
          }}
        >
          <i className="bi bi-download"></i>
          Download File
        </button>
      </div>
    );
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await api.delete(`/projects/${id}/attachments/${attachmentId}`);
      toast.success('Attachment deleted successfully');
      fetchProjectDetails();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete attachment');
    }
  };

  const handleUploadSuccess = (newAttachment) => {
    fetchProjectDetails();
  };

  // Generate activity feed from project data
  const getActivityFeed = () => {
    if (!project) return [];
    
    const activities = [];

    // Project created
    activities.push({
      type: 'created',
      icon: 'bi-plus-circle',
      color: 'success',
      title: 'Project Created',
      description: `by ${project.owner?.firstName} ${project.owner?.lastName}`,
      date: project.createdAt
    });

    // Collaborators joined
    if (project.collaborators && project.collaborators.length > 0) {
      project.collaborators.forEach((collab) => {
        activities.push({
          type: 'collaborator',
          icon: 'bi-person-plus',
          color: 'primary',
          title: 'Collaborator Joined',
          description: `${collab.user?.firstName || collab.firstName || 'User'} ${collab.user?.lastName || collab.lastName || ''} joined as ${collab.role || 'Collaborator'}`,
          date: collab.joinedAt || project.updatedAt
        });
      });
    }

    // Files uploaded
    if (project.attachments && project.attachments.length > 0) {
      project.attachments.forEach((file) => {
        activities.push({
          type: 'file',
          icon: 'bi-file-earmark-arrow-up',
          color: 'info',
          title: 'File Uploaded',
          description: file.filename,
          date: file.uploadedAt || project.updatedAt
        });
      });
    }

    // Publications added
    if (project.publications && project.publications.length > 0) {
      project.publications.forEach((pub) => {
        activities.push({
          type: 'publication',
          icon: 'bi-journal-text',
          color: 'warning',
          title: 'Publication Added',
          description: pub.title || 'Research publication',
          date: pub.publishedDate || project.updatedAt
        });
      });
    }

    // Status changes (if we had history, but we can infer from current status)
    if (project.status && project.status !== 'Planning') {
      activities.push({
        type: 'status',
        icon: 'bi-arrow-repeat',
        color: 'secondary',
        title: 'Status Updated',
        description: `Project status changed to ${project.status}`,
        date: project.updatedAt
      });
    }

    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const activityFeed = getActivityFeed();

  // Check if user is owner or collaborator — safely compare ObjectId or string IDs
  const currentUserId = String(user?._id || user?.id || '');
  const projectOwnerId = String(project?.owner?._id || project?.owner?.id || project?.owner || '');
  const isOwner = Boolean(
    user &&
    project &&
    currentUserId &&
    projectOwnerId &&
    projectOwnerId === currentUserId
  );
  const isCollaborator = Boolean(
    user &&
    project?.collaborators?.some(collab => {
      const collabUserId = String(collab?.user?._id || collab?.user?.id || collab?.user || '');
      return Boolean(collabUserId && collabUserId === currentUserId);
    })
  );
  const canUploadFiles = isOwner || isCollaborator;

  // Verification functions
  const fetchProfessors = async () => {
    try {
      const response = await api.get('/projects/professors');
      setProfessors(response.data.data.professors || []);
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      const response = await api.get(`/projects/${id}/verification-requests`);
      setVerificationRequests(response.data.data.requests || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    }
  };

  const handleOpenVerificationModal = async () => {
    try {
      // Fetch professors for selection
      await fetchProfessors();
      
      // Only fetch existing requests if user is the owner (to avoid 403 errors)
      if (isOwner) {
        await fetchVerificationRequests();
      }
      
      // Only show modal after data is loaded
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Error opening verification modal:', error);
      toast.error('Failed to load verification data');
    }
  };

  const handleSendVerificationRequest = async () => {
    if (!verificationMessage.trim() && !selectedProfessor) {
      toast.warning('Please add a message or select a professor');
      return;
    }

    try {
      setSendingRequest(true);
      await api.post(`/projects/${id}/verification-request`, {
        message: verificationMessage,
        professorId: selectedProfessor || undefined
      });

      toast.success('Verification request sent successfully!');
      setShowVerificationModal(false);
      setVerificationMessage('');
      setSelectedProfessor('');
      
      // Refresh verification requests
      await fetchVerificationRequests();
    } catch (error) {
      console.error('Error sending verification request:', error);
      toast.error(error.response?.data?.message || 'Failed to send verification request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return <div className="ds-loading"><div className="ds-spinner"></div></div>;
  }

  // Check if there's a pending verification request
  const hasPendingRequest = verificationRequests.some(req => req.status === 'PENDING');

  if (!project) {
    return (
      <div className="container section">
        <div className="ds-empty">
          <div className="ds-empty-icon"><i className="bi bi-exclamation-triangle"></i></div>
          <h3>Project Not Found</h3>
          <p>The project you're looking for doesn't exist or has been removed.</p>
          <Link to="/projects" className="btn btn-primary mt-3">
            <i className="bi bi-arrow-left me-2"></i>Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Top Bar: Navigation Breadcrumbs (Left) + Unified Action Toolbar (Right) */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-3 border-bottom">
        {/* Navigation / Breadcrumb */}
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center px-2.5 py-1.5"
            onClick={() => navigate('/projects')}
          >
            <i className="bi bi-arrow-left me-1.5"></i>
            Back to Projects
          </button>
          <span className="text-muted opacity-50 d-none d-sm-inline">/</span>
          <nav aria-label="breadcrumb" className="d-none d-sm-inline-block">
            <ol className="breadcrumb mb-0" style={{ fontSize: '0.85rem' }}>
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/projects" className="text-decoration-none text-muted">Projects</Link></li>
              <li className="breadcrumb-item active text-truncate" style={{ maxWidth: '220px' }}>{project?.title}</li>
            </ol>
          </nav>
        </div>

        {/* Unified Action Toolbar */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Utility: Export to PDF */}
          <button
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center"
            onClick={() => window.print()}
            title="Print or save as PDF"
          >
            <i className="bi bi-printer me-1.5"></i>
            Export PDF
          </button>

          {/* Owner Secondary: Request Verification Button */}
          {isOwner && !project.is_verified && !hasPendingRequest && (
            <button 
              className="btn btn-outline-success btn-sm d-inline-flex align-items-center"
              onClick={handleOpenVerificationModal}
            >
              <i className="bi bi-patch-check me-1.5"></i>
              Request Verification
            </button>
          )}

          {/* Owner Secondary: Verification Requested Badge */}
          {isOwner && !project.is_verified && hasPendingRequest && (
            <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2.5 py-1.5 d-inline-flex align-items-center" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-clock-history me-1.5"></i>
              Verification Requested
            </span>
          )}

          {/* Owner Secondary: Invite Collaborators Button */}
          {isOwner && (
            <button
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
              onClick={() => navigate('/send-collaboration-request', {
                state: { project }
              })}
            >
              <i className="bi bi-person-plus me-1.5"></i>
              Invite Collaborators
            </button>
          )}

          {/* Non-Member Primary CTA: Request to Join */}
          {!isOwner && !isCollaborator && user && user.role !== 'admin' && project.isOpenForCollaboration !== false && (
            <button 
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
              onClick={() => navigate('/send-collaboration-request', {
                state: { project, targetUser: project.owner }
              })}
            >
              <i className="bi bi-person-plus me-1.5"></i>
              Request to Join
            </button>
          )}

          {/* Member / Admin Primary CTA: Edit Project */}
          {user && (isOwner || isCollaborator || user.role === 'admin') && (
            <button 
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
              onClick={() => navigate(`/projects/edit/${id}`)}
            >
              <i className="bi bi-pencil me-1.5"></i>
              Edit Project
            </button>
          )}
        </div>
      </div>

      {/* Project Header: Title & Badges Full Width */}
      <div className="mb-4">
        <h1 className="fw-bold mb-2.5" style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          {project.title}
        </h1>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className={`badge ${getStatusBadgeClass(project.status)}`}>
            {project.status}
          </span>
          {project.is_verified && (
            <span className="badge bg-success">
              <i className="bi bi-patch-check-fill me-1" />
              Verified
            </span>
          )}
          {project.plagiarism_flag && (
            <span className="badge bg-danger" title={`${Math.round(project.plagiarism_score * 100)}% similarity detected`}>
              <i className="bi bi-exclamation-triangle-fill me-1" />
              Plagiarism ({Math.round(project.plagiarism_score * 100)}%)
            </span>
          )}
          {project.researchArea && (
            <span className="badge bg-info">
              <i className="bi bi-tag me-1" />
              {project.researchArea}
            </span>
          )}
          {project.visibility && (
            <span className={`badge ${project.visibility === 'Public' ? 'bg-success' : 'bg-secondary'}`}>
              <i className={`bi ${project.visibility === 'Public' ? 'bi-globe' : 'bi-lock'} me-1`} />
              {project.visibility}
            </span>
          )}
          {/* Collaborators & Capacity Badge */}
          {(() => {
            const activeCollaborators = (project.collaborators || []).filter(
              c => c.user && (typeof c.user !== 'object' || c.user._id || c.user.firstName)
            );
            const collabCount = activeCollaborators.length;
            return (
              <span
                className="badge bg-light text-dark border d-inline-flex align-items-center"
                title={`1 Project Lead + ${collabCount} Collaborators (Max capacity: ${project.maxCollaborators || 10})`}
                style={{ fontWeight: 500 }}
              >
                <i className="bi bi-people text-primary me-1.5" />
                <span>{collabCount} / {project.maxCollaborators || 10} Collaborators</span>
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 ms-1.5 px-1.5 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  {collabCount + 1} Total
                </span>
              </span>
            );
          })()}
        </div>
      </div>

      {/* Plagiarism Warning Alert */}
      {project.plagiarism_flag && (
        <div className="alert alert-danger d-flex align-items-start mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
          <div className="flex-grow-1">
            <h5 className="alert-heading mb-2">
              <strong>Plagiarism Detection Alert</strong>
            </h5>
            <p className="mb-2">
              This project has been flagged for possible plagiarism with a similarity score of <strong>{Math.round(project.plagiarism_score * 100)}%</strong>.
            </p>
            {project.matched_project_id && (
              <p className="mb-2">
                Similar content detected in another project. 
                {(isOwner || user?.designation === 'Professor') && (
                  <>
                    {' '}<a href={`/projects/${project.matched_project_id}`} target="_blank" rel="noopener noreferrer" className="alert-link">
                      View similar project <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                  </>
                )}
              </p>
            )}
            <hr />
            <p className="mb-0 small">
              <i className="bi bi-info-circle me-1"></i>
              This automated check may produce false positives. 
              {user?.designation === 'Professor' && ' Please review manually before taking action.'}
              {isOwner && ' If you believe this is an error, please contact a professor or administrator.'}
            </p>
          </div>
        </div>
      )}

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Description */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <i className="bi bi-file-text text-primary me-2"></i>
                Description
              </h4>
              <p className="card-text text-muted" style={{ whiteSpace: 'pre-line' }}>
                {project.description}
              </p>
            </div>
          </div>

          {/* Objectives */}
          {project.objectives && project.objectives.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-bullseye text-primary me-2"></i>
                  Objectives
                </h4>
                <ul className="list-group list-group-flush">
                  {project.objectives.map((objective, index) => (
                    <li key={index} className="list-group-item">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Methodology */}
          {project.methodology && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-gear text-primary me-2"></i>
                  Methodology
                </h4>
                <p className="card-text text-muted" style={{ whiteSpace: 'pre-line' }}>
                  {project.methodology}
                </p>
              </div>
            </div>
          )}

          {/* Expected Outcomes */}
          {project.expectedOutcomes && project.expectedOutcomes.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-trophy text-primary me-2"></i>
                  Expected Outcomes
                </h4>
                <ul className="list-group list-group-flush">
                  {project.expectedOutcomes.map((outcome, index) => (
                    <li key={index} className="list-group-item">
                      <i className="bi bi-arrow-right-circle text-info me-2"></i>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Keywords */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-tags text-primary me-2"></i>
                  Keywords
                </h4>
                <div className="d-flex flex-wrap gap-4">
                  {project.keywords.map((keyword, index) => (
                    <span key={index} className="badge bg-light text-dark border px-3 py-2">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File Upload (for owner/collaborators) */}
          {canUploadFiles && (
            <FileUpload projectId={id} onUploadSuccess={handleUploadSuccess} />
          )}

          {/* Attachments */}
          {project.attachments && project.attachments.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-paperclip text-primary me-2"></i>
                  Project Files ({project.attachments.length})
                </h4>
                <FileTreeView
                  attachments={project.attachments}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                  onDelete={handleDeleteAttachment}
                  canDelete={canUploadFiles}
                />
              </div>
            </div>
          )}

          {/* Publications */}
          {project.publications && project.publications.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-journal-text text-primary me-2"></i>
                  Publications
                </h4>
                <div className="list-group">
                  {project.publications.map((publication, index) => (
                    <a 
                      key={index}
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{publication.title}</h6>
                          {publication.publishedDate && (
                            <small className="text-muted">
                              Published: {formatDate(publication.publishedDate)}
                            </small>
                          )}
                        </div>
                        <i className="bi bi-box-arrow-up-right text-primary"></i>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activityFeed.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-3">
                  <i className="bi bi-clock-history text-primary me-2"></i>
                  Recent Activity
                </h4>
                <div className="activity-timeline">
                  {activityFeed.slice(0, 10).map((activity, index) => (
                    <div key={index} className="activity-item d-flex mb-3 pb-3 border-bottom">
                      <div className="activity-icon me-3">
                        <div 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-accent)',
                            fontSize: '0.9rem'
                          }}
                        >
                          <i className={`bi ${activity.icon}`} />
                        </div>
                      </div>
                      <div className="activity-content flex-grow-1">
                        <h6 className="mb-1 fw-semibold">{activity.title}</h6>
                        <p className="mb-1 text-muted small">{activity.description}</p>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>
                    </div>
                  ))}
                  {activityFeed.length === 0 && (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-inbox display-6 d-block mb-2"></i>
                      <p>No activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Project Discussions & Comments */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="card-title mb-4 d-flex align-items-center justify-content-between">
                <span>
                  <i className="bi bi-chat-left-text me-2 text-primary"></i>
                  Discussions & Comments ({comments.length})
                </span>
                <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-broadcast me-1"></i> Live
                </span>
              </h4>

              {/* Comment Input */}
              {user ? (
                <form onSubmit={handleAddComment} className="mb-4">
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Ask a question, share feedback, or leave a thought..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      disabled={submittingComment}
                      style={{ borderRadius: '10px' }}
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submittingComment || !newCommentText.trim()}
                      style={{ borderRadius: '8px', padding: '6px 16px' }}
                    >
                      {submittingComment ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Posting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-1"></i> Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="alert alert-light border mb-4 text-center py-3">
                  <p className="mb-2 text-muted">Please log in to join the discussion.</p>
                  <Link to="/login" className="btn btn-primary btn-sm">Log In</Link>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list d-flex flex-col gap-3">
                {comments.map((comment) => (
                  <div key={comment._id} className="p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={comment.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent((comment.author?.firstName || 'User') + ' ' + (comment.author?.lastName || ''))}&background=4F46E5&color=fff&size=64`}
                          alt="avatar"
                          className="rounded-circle"
                          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                        <span className="fw-semibold text-dark">
                          {comment.author?.firstName} {comment.author?.lastName}
                        </span>
                      </div>
                      <small className="text-muted">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                    <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                      {comment.text}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-chat-dots display-6 d-block mb-2 text-muted"></i>
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Project Info Card */}
          <div className="card shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <h5 className="rh-sidebar-title">Project Information</h5>
              
              {/* Owner */}
              {project.owner && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Project Lead</small>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-circle text-primary me-2 fs-5"></i>
                    <div>
                      <div className="fw-semibold">
                        {project.owner.firstName} {project.owner.lastName}
                      </div>
                      <small className="text-muted">{project.owner.email}</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Members & Collaborators Section */}
              {(() => {
                // Only count collaborators with a valid (non-deleted) user reference
                const validCollaborators = (project.collaborators || []).filter(
                  c => c.user && (typeof c.user !== 'object' || c.user._id || c.user.firstName)
                );
                const collabCount = validCollaborators.length;
                return (
                  <div className="mb-3 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <small className="text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                        Team &amp; Collaborators
                      </small>
                      {collabCount > 0 && (
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.75rem' }}>
                          {collabCount} Collaborator{collabCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {collabCount > 0 ? (
                      <div className="d-flex flex-column gap-2 mt-2">
                        {validCollaborators.map((collab, index) => {
                          const u = collab.user || {};
                          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Collaborator';
                          const username = u.username ? `@${u.username}` : null;
                          const avatarUrl = u.profilePicture && u.profilePicture !== 'default-avatar.jpg'
                            ? u.profilePicture
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff&size=64`;

                          return (
                            <div key={index} className="p-2 rounded-3 bg-light border d-flex align-items-center gap-2">
                              <img
                                src={avatarUrl}
                                alt="Collaborator"
                                className="rounded-circle flex-shrink-0"
                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                              />
                              <div className="min-w-0 flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between gap-1">
                                  <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>
                                    {name}
                                  </span>
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                                    {collab.role || 'Collaborator'}
                                  </span>
                                </div>
                                {username && (
                                  <small className="text-muted d-block text-truncate" style={{ fontSize: '0.74rem' }}>
                                    {username}
                                  </small>
                                )}
                                {u.institution && (
                                  <small className="text-muted d-block text-truncate" style={{ fontSize: '0.74rem' }}>
                                    {u.institution}
                                  </small>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted small mt-1" style={{ fontSize: '0.8rem' }}>
                        No collaborators yet.
                        {project.isOpenForCollaboration && (
                          <span className="d-block text-success fw-semibold mt-1" style={{ fontSize: '0.74rem' }}>
                            • Open for collaboration ({project.maxCollaborators || 10} slots available)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}


              {/* Timeline */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">Timeline</small>
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-calendar-check text-success me-2"></i>
                  <small>Start: {formatDate(project.startDate)}</small>
                </div>
                {project.endDate && (
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-x text-danger me-2"></i>
                    <small>End: {formatDate(project.endDate)}</small>
                  </div>
                )}
              </div>

              {/* Funding */}
              {Boolean(project.fundingAmount && project.fundingAmount > 0) && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Funding</small>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-cash-stack text-success me-2 fs-5"></i>
                    <div>
                      <div className="fw-bold text-success">
                        ${project.fundingAmount.toLocaleString()}
                      </div>
                      {project.fundingSource && (
                        <small className="text-muted">{project.fundingSource}</small>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="d-grid gap-2 mt-4">
                {project.repository && (
                  <a 
                    href={project.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark btn-sm"
                  >
                    <i className="bi bi-github me-2"></i>
                    View Repository
                  </a>
                )}
                {project.documentation && (
                  <a 
                    href={project.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="bi bi-book me-2"></i>
                    Documentation
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Share Card */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="rh-sidebar-title">Share Project</h5>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-sm btn-outline-secondary text-start"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  <i className="bi bi-link-45deg me-2 text-primary"></i>
                  Copy Link
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-secondary text-start"
                >
                  <i className="bi bi-twitter-x me-2 text-dark"></i>
                  Share on X (Twitter)
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-secondary text-start"
                >
                  <i className="bi bi-linkedin me-2 text-primary"></i>
                  Share on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {showPreviewModal && previewFile && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPreviewModal(false);
              setPreviewFile(null);
            }
          }}
        >
          <div 
            className="modal-dialog"
            style={{ 
              margin: 'auto', 
              maxWidth: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getFileExtension(previewFile.filename || previewFile.name)) ? '850px' : '560px',
              width: '100%'
            }}
          >
            <div 
              className="modal-content"
              style={{
                background: '#ffffff',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden'
              }}
            >
              <div 
                className="modal-header d-flex align-items-center justify-content-between"
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '1.1rem 1.5rem'
                }}
              >
                <div className="d-flex align-items-center gap-3 overflow-hidden me-2">
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4f46e5',
                      fontSize: '1.15rem',
                      flexShrink: 0
                    }}
                  >
                    <i className={`bi ${getFileIcon(previewFile.filename || previewFile.name)}`}></i>
                  </div>
                  <div className="overflow-hidden">
                    <h5 
                      className="modal-title mb-0 text-truncate"
                      style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#0f172a'
                      }}
                      title={previewFile.filename || previewFile.name}
                    >
                      {previewFile.filename || previewFile.name}
                    </h5>
                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {getFileExtension(previewFile.filename || previewFile.name).toUpperCase()} File
                      {previewFile.fileSize ? ` • ${formatFileSize(previewFile.fileSize)}` : ''}
                    </small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  aria-label="Close"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                  }}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                ></button>
              </div>

              <div className="modal-body p-0" style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                {renderPreview()}
              </div>

              <div 
                className="modal-footer d-flex justify-content-end gap-2"
                style={{
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  padding: '1rem 1.5rem'
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleDownload(previewFile)}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.35rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.25)';
                  }}
                >
                  <i className="bi bi-download"></i>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Request Modal */}
      {showVerificationModal && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVerificationModal(false);
              setVerificationMessage('');
              setSelectedProfessor('');
            }
          }}
        >
          <div 
            className="modal-dialog"
            style={{ 
              margin: 'auto', 
              maxWidth: '600px',
              width: '100%'
            }}
          >
            <div 
              className="modal-content" 
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(8, 145, 94, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}
            >
              <div 
                className="modal-header" 
                style={{
                  background: 'linear-gradient(135deg, #08915e 0%, #0bc47e 100%)',
                  border: 'none',
                  padding: '1.5rem 2rem',
                  color: '#ffffff'
                }}
              >
                <h5 className="modal-title" style={{ 
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: '600',
                  fontSize: '1.5rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  margin: 0
                }}>
                  <i className="bi bi-send-check me-2" style={{ fontSize: '1.75rem' }}></i>
                  Request Project Verification
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setVerificationMessage('');
                    setSelectedProfessor('');
                  }}
                  style={{
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.9
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ 
                padding: '2rem',
                background: '#ffffff'
              }}>
                <div 
                  className="alert" 
                  style={{
                    background: 'linear-gradient(135deg, #e8f5f1 0%, #f0faf7 100%)',
                    border: '1px solid #0bc47e',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    color: '#2d465e',
                    display: 'flex',
                    alignItems: 'flex-start'
                  }}
                >
                  <i className="bi bi-info-circle me-2" style={{ 
                    fontSize: '1.25rem', 
                    color: '#08915e',
                    marginTop: '2px'
                  }}></i>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    Request a professor to verify your project. Verified projects gain more visibility and credibility.
                  </div>
                </div>

                <div className="mb-4">
                  <label 
                    htmlFor="professorSelect" 
                    className="form-label" 
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: '#2d465e',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Select Professor <span style={{ 
                      color: '#6c757d', 
                      fontWeight: '400',
                      fontSize: '0.9rem'
                    }}>(Optional)</span>
                  </label>
                  <select
                    id="professorSelect"
                    className="form-select"
                    value={selectedProfessor}
                    onChange={(e) => setSelectedProfessor(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e0e8e5',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: '#f8fffe'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#08915e'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e8e5'}
                  >
                    <option value="">Any Professor</option>
                    {professors.map(prof => (
                      <option key={prof._id} value={prof._id}>
                        {prof.firstName} {prof.lastName} - {prof.institution}
                      </option>
                    ))}
                  </select>
                  <div 
                    className="form-text" 
                    style={{ 
                      color: '#6c757d', 
                      fontSize: '0.875rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    Leave empty to allow any professor to verify your project
                  </div>
                </div>

                <div className="mb-4">
                  <label 
                    htmlFor="verificationMessage" 
                    className="form-label"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: '#2d465e',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Message to Professor
                  </label>
                  <textarea
                    id="verificationMessage"
                    className="form-control"
                    rows="4"
                    placeholder="Explain why your project should be verified..."
                    value={verificationMessage}
                    onChange={(e) => setVerificationMessage(e.target.value)}
                    maxLength="500"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e0e8e5',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: '#f8fffe',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#08915e'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e8e5'}
                  ></textarea>
                  <div 
                    className="form-text" 
                    style={{ 
                      color: '#6c757d', 
                      fontSize: '0.875rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    {verificationMessage.length}/500 characters
                  </div>
                </div>

                {verificationRequests.length > 0 && (
                  <div className="mb-3">
                    <h6 style={{
                      fontFamily: "'Raleway', sans-serif",
                      fontWeight: '600',
                      color: '#2d465e',
                      fontSize: '1rem',
                      marginBottom: '0.75rem'
                    }}>Previous Requests:</h6>
                    <div className="list-group" style={{ gap: '0.5rem' }}>
                      {verificationRequests.slice(0, 3).map(req => (
                        <div 
                          key={req._id} 
                          className="list-group-item"
                          style={{
                            border: '1px solid #e0e8e5',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            background: '#f8fffe'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span 
                                className={`badge ${req.status === 'PENDING' ? 'bg-warning' : req.status === 'APPROVED' ? 'bg-success' : 'bg-danger'}`}
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {req.status}
                              </span>
                              <small className="ms-2 text-muted">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div 
                className="modal-footer" 
                style={{
                  background: 'linear-gradient(135deg, #f8fffe 0%, #f1f8f5 100%)',
                  border: 'none',
                  padding: '1.25rem 2rem',
                  gap: '0.75rem'
                }}
              >
                <button
                  className="btn"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setVerificationMessage('');
                    setSelectedProfessor('');
                  }}
                  disabled={sendingRequest}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    border: '2px solid #dee2e6',
                    background: '#ffffff',
                    color: '#6c757d',
                    fontWeight: '500',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#adb5bd';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#dee2e6';
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleSendVerificationRequest}
                  disabled={sendingRequest}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #08915e 0%, #0bc47e 100%)',
                    color: '#ffffff',
                    fontWeight: '500',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(8, 145, 94, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(8, 145, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(8, 145, 94, 0.3)';
                  }}
                >
                  {sendingRequest ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;