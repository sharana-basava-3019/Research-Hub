import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import CollaborateModal from '../components/CollaborateModal';

const Projects = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMyProjects, setShowMyProjects] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (location.state?.selectedResearchArea) {
      setFilterCategory(location.state.selectedResearchArea);
      window.history.replaceState({}, document.title);
    }
    
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [location.state?.selectedResearchArea, location.search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects', {
        params: { limit: 100 }
      });
      const data = res.data?.data?.projects || res.data?.projects || res.data || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(error.response?.data?.message || 'Failed to load projects', { toastId: 'projects-error' });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.keywords?.some(k => typeof k === 'string' && k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || project.status === filterStatus;
    const matchesCategory = !filterCategory || (project.researchArea === filterCategory || project.category === filterCategory);
    
    const currentUserId = user?._id || user?.id;
    const projectOwnerId = project.owner?._id || project.owner?.id || project.owner;
    const matchesOwner = !showMyProjects || (currentUserId && projectOwnerId === currentUserId);

    return matchesSearch && matchesStatus && matchesCategory && matchesOwner;
  });

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory, showMyProjects]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Planning':
        return <span className="status-pill status-planning">Planning</span>;
      case 'In Progress':
        return <span className="status-pill status-progress">In Progress</span>;
      case 'Completed':
        return <span className="status-pill status-completed">Completed</span>;
      case 'On Hold':
        return <span className="status-pill status-hold">On Hold</span>;
      case 'Cancelled':
        return <span className="status-pill status-cancelled">Cancelled</span>;
      default:
        return <span className="status-pill status-progress">{status || 'Active'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="ds-loading">
            <div className="ds-spinner" />
            <p>Loading research catalog…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        {/* Collaborate Modal */}
        <CollaborateModal
          show={showCollaborateModal}
          onClose={() => {
            setShowCollaborateModal(false);
            setSelectedProject(null);
            setSelectedUser(null);
          }}
          targetUser={selectedUser}
          project={selectedProject}
        />

        {/* Page Header */}
        <div className="rh-page-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1>Research Projects</h1>
            <p>
              {showMyProjects
                ? 'Your research initiatives, published drafts, and active collaborations'
                : 'Explore scholarly initiatives, open datasets, and peer-reviewed studies'}
            </p>
          </div>
          {user && (
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setShowMyProjects(!showMyProjects)}
                className={`btn ${showMyProjects ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                <i className={`bi bi-${showMyProjects ? 'grid-3x3-gap' : 'person'}`} />
                {showMyProjects ? 'All Projects' : 'My Projects'}
              </button>
              <Link to="/projects/create" className="btn btn-primary">
                <i className="bi bi-plus-lg" />
                New Project
              </Link>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="rh-filter-bar">
          <div className="rh-search-bar">
            <i className="bi bi-search rh-search-icon" />
            <input
              type="text"
              placeholder="Search by title, description, or keyword…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 150 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 180 }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Research Areas</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Data Science">Data Science</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Biomedical Engineering">Biomedical Engineering</option>
            <option value="Environmental Science">Environmental Science</option>
            <option value="Climate Change">Climate Change</option>
            <option value="Renewable Energy">Renewable Energy</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Engineering">Engineering</option>
            <option value="Other">Other</option>
          </select>

          {(searchTerm || filterStatus || filterCategory || showMyProjects) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterCategory('');
                setShowMyProjects(false);
              }}
              title="Reset filters"
            >
              <i className="bi bi-x-circle me-1" />
              Reset
            </button>
          )}
        </div>

        {/* Results Count Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>
          <span>Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="ds-empty card p-6">
            <div className="ds-empty-icon"><i className="bi bi-folder2-open" /></div>
            <h4>No matching projects found</h4>
            <p>
              {searchTerm || filterStatus || filterCategory
                ? 'Try refining your search keyword or clearing the filters above.'
                : 'Be the first researcher to publish a project in this workspace.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px', marginBottom: '32px' }}>
            {currentProjects.map((project) => {
              const currentUserId = user?._id || user?.id;
              const projectOwnerId = project.owner?._id || project.owner?.id || project.owner;
              const isOwner = currentUserId && projectOwnerId === currentUserId;

              // Filter out ghost collaborators (deleted users populate as null)
              const validCollaborators = (project.collaborators || []).filter(
                c => c.user && (typeof c.user !== 'object' || c.user._id || c.user.firstName)
              );

              // Truncate description to 120 characters
              const fullDesc = project.description || '';
              const truncatedDesc = fullDesc.length > 120 ? fullDesc.slice(0, 120).trimEnd() + '…' : fullDesc;

              return (
                <div key={project._id} className="rh-project-card d-flex flex-column h-100">
                  <div className="rh-project-card-body d-flex flex-column flex-grow-1">

                    {/* Row 1: Status + Verified + Flagged Caution Symbol LEFT · Category RIGHT */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2" style={{ gap: '8px' }}>
                      <div className="d-flex align-items-center flex-wrap" style={{ gap: '6px' }}>
                        {getStatusBadge(project.status)}
                        {project.is_verified && (
                          <span className="badge badge-success" title="Verified by a faculty professor">
                            <i className="bi bi-patch-check-fill" /> Verified
                          </span>
                        )}
                        {project.plagiarism_flag && (
                          <div className="rh-tooltip-wrapper">
                            <span className="rh-flagged-pill">
                              <i className="bi bi-exclamation-triangle-fill" />
                            </span>
                            <div className="rh-tooltip-content">
                              <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '0.75rem' }} />
                              <span>FLAGGED AS PLAGIARISED — Similarity: {Math.round(project.plagiarism_score * 100)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {(project.researchArea || project.category) && (
                        <span className="rh-category-badge" style={{ maxWidth: '100%' }}>
                          <i className="bi bi-tag" style={{ fontSize: '0.65rem' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.researchArea || project.category}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link to={`/projects/${project._id}`} style={{ textDecoration: 'none' }}>
                      <h4 className="rh-project-title">{project.title}</h4>
                    </Link>

                    {/* Description — truncated to 120 chars */}
                    <p className="rh-project-desc" style={{ flexGrow: 1 }}>{truncatedDesc}</p>

                    {/* Meta row */}
                    <div className="rh-project-meta mt-auto pt-3">
                      {project.owner && (
                        <span>
                          <i className="bi bi-person me-1" />
                          {project.owner.firstName} {project.owner.lastName}
                        </span>
                      )}
                      <span>
                        <i className="bi bi-people me-1" />
                        {validCollaborators.length + 1} member{validCollaborators.length + 1 !== 1 ? 's' : ''}
                      </span>
                      {project.startDate && (
                        <span>
                          <i className="bi bi-calendar me-1" />
                          {formatDate(project.startDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="rh-project-footer flex items-center justify-between flex-wrap gap-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="rh-project-btn-details"
                      style={{ flex: '1 1 120px' }}
                    >
                      <span>View Details</span>
                      <i className="bi bi-arrow-right" />
                    </Link>

                    {!isOwner && user && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: '1 1 120px' }}
                        onClick={() => {
                          navigate('/send-collaboration-request', {
                            state: { project: project, targetUser: project.owner }
                          });
                        }}
                      >
                        <i className="bi bi-person-plus me-1" />
                        Collaborate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredProjects.length > itemsPerPage && (
          <div className="rh-pagination justify-center">
            <button
              className="rh-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left me-1" /> Prev
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    className={`rh-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return <span key={pageNumber} style={{ padding: '0 4px', color: 'var(--color-text-3)' }}>…</span>;
              }
              return null;
            })}
            <button
              className="rh-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <i className="bi bi-chevron-right ms-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;