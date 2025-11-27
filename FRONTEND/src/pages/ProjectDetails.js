import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import FileUpload from '../components/FileUpload';
import FileTreeView from '../components/FileTreeView';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      console.log('Project data received:', response.data);
      setProject(response.data.data.project);
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
    const downloadUrl = `http://localhost:5000${attachment.url}`;
    window.open(downloadUrl, '_blank');
    toast.success(`Downloading: ${attachment.filename}`);
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

  // Check if user is owner or collaborator
  const isOwner = user && project?.owner?._id === user.id;
  const isCollaborator = user && project?.collaborators?.some(
    collab => collab.user?._id === user.id || collab.user === user.id
  );
  const canUploadFiles = isOwner || isCollaborator;

  if (loading) {
    return (
      <div className="container section text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container section text-center">
        <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
        <h3 className="mt-3">Project Not Found</h3>
        <p className="text-muted">The project you're looking for doesn't exist or has been removed.</p>
        <Link to="/projects" className="btn btn-primary mt-3">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Back Button */}
      <div className="mb-3">
        <button 
          className="btn btn-link text-decoration-none p-0"
          onClick={() => navigate('/projects')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Projects
        </button>
      </div>

      {/* Breadcrumb - Minimal Style */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <p className="text-muted mb-0">
            <Link to="/" className="text-decoration-none text-muted">Home</Link>
            {' > '}
            <Link to="/projects" className="text-decoration-none text-muted">Projects</Link>
            {' > '}
            <span className="text-dark fw-semibold">{project?.title || 'Loading...'}</span>
          </p>
        </nav>
      </div>

      {/* Project Header */}
      <div className="row mb-4">
        <div className="col-lg-8">
          <h1 className="display-5 fw-bold mb-3">{project.title}</h1>
          <div className="d-flex flex-wrap gap-4 mb-3">
            <span className={`badge ${getStatusBadgeClass(project.status)} px-3 py-2`}>
              {project.status}
            </span>
            {project.researchArea && (
              <span className="badge bg-info px-3 py-2">
                <i className="bi bi-bookmark me-1"></i>
                {project.researchArea}
              </span>
            )}
            {project.visibility && (
              <span className={`badge ${project.visibility === 'Public' ? 'bg-success' : 'bg-secondary'} px-3 py-2`}>
                <i className={`bi ${project.visibility === 'Public' ? 'bi-globe' : 'bi-lock'} me-1`}></i>
                {project.visibility}
              </span>
            )}
          </div>
        </div>
        <div className="col-lg-4 text-lg-end">
          {user && (project.owner?._id === user.id || user.role === 'admin') && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit Project
            </button>
          )}
        </div>
      </div>

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
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Project Info Card */}
          <div className="card shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              <h5 className="card-title mb-3">Project Information</h5>
              
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

              {/* Team */}
              {project.team && project.team.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-2">Team Members</small>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-people text-primary me-2"></i>
                    <span className="fw-semibold">{project.team.length + 1} members</span>
                  </div>
                  <div className="ms-4">
                    {project.team.slice(0, 3).map((member, index) => (
                      <div key={index} className="mb-1">
                        <small>
                          {member.firstName} {member.lastName}
                          {member.role && ` - ${member.role}`}
                        </small>
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <small className="text-muted">
                        +{project.team.length - 3} more
                      </small>
                    )}
                  </div>
                </div>
              )}

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
              {project.fundingAmount && (
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

              {/* Collaborators Section */}
              {project.collaborators && project.collaborators.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted d-block mb-2">External Collaborators</small>
                  {project.collaborators.map((collab, index) => (
                    <div key={index} className="mb-2">
                      <small className="fw-semibold">{collab.name}</small>
                      {collab.organization && (
                        <small className="text-muted d-block">{collab.organization}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Share Card */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Share Project</h6>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  <i className="bi bi-link-45deg me-2"></i>
                  Copy Link
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-info"
                >
                  <i className="bi bi-twitter me-2"></i>
                  Share on Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bi bi-linkedin me-2"></i>
                  Share on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;