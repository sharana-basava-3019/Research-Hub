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
    // Set filter from navigation state if available
    if (location.state?.selectedResearchArea) {
      setFilterCategory(location.state.selectedResearchArea);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
    
    // Handle search query parameter from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [location.state?.selectedResearchArea, location.search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects...');
      
      const res = await api.get('/projects', {
        params: {
          limit: 100
        }
      });
      
      console.log('API Response:', res.data);
      
      // Handle different response structures
      const projects = res.data?.data?.projects || res.data?.projects || res.data || [];
      console.log('Extracted projects:', projects);
      
      setProjects(Array.isArray(projects) ? projects : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // For development purposes, if server is down, use mock data
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.response?.status === undefined) {
        console.log('Server appears to be down, using mock data for development');
        
        // Mock data for development testing
        const mockProjects = [
          {
            _id: 'mock1',
            title: 'AI in Healthcare Research',
            description: 'Exploring the applications of artificial intelligence in modern healthcare systems and patient care optimization.',
            researchArea: 'Artificial Intelligence',
            status: 'In Progress',
            owner: {
              firstName: 'Dr. Sarah',
              lastName: 'Johnson',
              institution: 'University Research Lab'
            },
            createdAt: new Date('2024-01-15').toISOString(),
            isOpenForCollaboration: true,
            visibility: 'Public'
          },
          {
            _id: 'mock2',
            title: 'Sustainable Energy Solutions',
            description: 'Developing innovative approaches to renewable energy storage and distribution for urban environments.',
            researchArea: 'Environmental Science',
            status: 'Planning',
            owner: {
              firstName: 'Prof. Michael',
              lastName: 'Chen',
              institution: 'Green Tech Institute'
            },
            createdAt: new Date('2024-02-20').toISOString(),
            isOpenForCollaboration: true,
            visibility: 'Public'
          },
          {
            _id: 'mock3',
            title: 'Quantum Computing Applications',
            description: 'Research into practical applications of quantum computing for solving complex computational problems.',
            researchArea: 'Computer Science',
            status: 'In Progress',
            owner: {
              firstName: 'Dr. Lisa',
              lastName: 'Wang',
              institution: 'Quantum Research Center'
            },
            createdAt: new Date('2024-03-10').toISOString(),
            isOpenForCollaboration: false,
            visibility: 'Public'
          }
        ];
        
        setProjects(mockProjects);
        // Only show this message in development and when server is actually unreachable
        if (process.env.NODE_ENV === 'development') {
          toast.info('Using sample data - server connection issue detected');
        }
        return;
      }
      
      // More specific error messages
      if (error.response?.status === 404) {
        toast.error('Projects endpoint not found');
      } else if (error.response?.status === 500) {
        toast.error('Server error - please try again later');
      } else {
        toast.error(`Failed to load projects: ${error.message}`);
      }
      
      // Set empty array on error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || project.status === filterStatus;
    const matchesCategory = !filterCategory || project.researchArea === filterCategory;
    
    // Filter by owner if "My Projects" is active
    const matchesOwner = !showMyProjects || (user && (project.owner?._id === user.id || project.owner === user.id));

    return matchesSearch && matchesStatus && matchesCategory && matchesOwner;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory, showMyProjects]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'warning',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'secondary',
      'Cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading projects...</p>
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

        {/* Header */}
        <div className="mb-6">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="display-4 fw-bold text-dark mb-2">Research Projects</h1>
              <p className="text-gray-600">
                {showMyProjects 
                  ? 'Your research projects and collaborations' 
                  : 'Explore innovative research projects and collaborations'}
              </p>
            </div>
            {user && (
              <div className="d-flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => setShowMyProjects(!showMyProjects)}
                  className={`${showMyProjects ? 'btn-niceschool-primary' : 'btn-niceschool-secondary'}`}
                >
                  <i className={`bi bi-${showMyProjects ? 'grid' : 'person'} me-2`}></i>
                  {showMyProjects ? 'All Projects' : 'My Projects'}
                </button>
                <Link to="/projects/create" className="btn-niceschool-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
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
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Marine Biology">Marine Biology</option>
                  <option value="Neuroscience">Neuroscience</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <i className="bi bi-folder-x display-1 text-muted mb-4"></i>
              <h3 className="text-xl fw-semibold text-gray-600 mb-2">
                No projects found
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus || filterCategory
                  ? 'Try adjusting your filters'
                  : 'Be the first to create a project!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-4 mb-5">
            {currentProjects.map((project) => (
              <div key={project._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm hover-lift">
                  <div className="card-body d-flex flex-column">
                    {/* Status Badge */}
                    <div className="mb-3">
                      <span className={`badge bg-${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      {project.is_verified && (
                        <span className="badge bg-success ms-2">
                          <i className="bi bi-patch-check-fill me-1"></i>
                          Verified
                        </span>
                      )}
                      {project.plagiarism_flag && (
                        <span className="badge bg-danger ms-2" title={`${Math.round(project.plagiarism_score * 100)}% similarity`}>
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          Plagiarism Alert
                        </span>
                      )}
                    </div>

                    {/* Project Title */}
                    <h5 className="card-title fw-bold mb-3">
                      <Link 
                        to={`/projects/${project._id}`}
                        className="text-dark text-decoration-none hover:text-primary"
                      >
                        {project.title}
                      </Link>
                    </h5>

                    {/* Description */}
                    <p className="card-text text-gray-600 mb-3 flex-grow-1" style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {project.description}
                    </p>

                    {/* Research Area */}
                    {project.researchArea && (
                      <div className="mb-3">
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-tag me-1"></i>
                          {project.researchArea}
                        </span>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="border-top pt-3 mt-auto">
                      {/* Owner */}
                      {project.owner && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-person-circle me-2 text-primary"></i>
                          <small className="text-muted">
                            {project.owner.firstName} {project.owner.lastName}
                          </small>
                        </div>
                      )}

                      {/* Team Size */}
                      {project.team && project.team.length > 0 && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-people me-2 text-primary"></i>
                          <small className="text-muted">
                            {project.team.length + 1} team member{project.team.length > 0 ? 's' : ''}
                          </small>
                        </div>
                      )}

                      {/* Date Range */}
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-calendar me-2 text-primary"></i>
                        <small className="text-muted">
                          {formatDate(project.startDate)}
                          {project.endDate && ` - ${formatDate(project.endDate)}`}
                        </small>
                      </div>

                      {/* Funding */}
                      {project.fundingAmount && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-cash-stack me-2 text-success"></i>
                          <small className="text-muted fw-semibold">
                            ${project.fundingAmount.toLocaleString()}
                          </small>
                        </div>
                      )}

                      {/* Attachments */}
                      {project.attachments && project.attachments.length > 0 && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-paperclip me-2 text-info"></i>
                          <small className="text-muted">
                            {project.attachments.length} file{project.attachments.length > 1 ? 's' : ''}
                          </small>
                        </div>
                      )}

                      {/* Repository */}
                      {project.repository && (
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-github me-2 text-dark"></i>
                          <small className="text-muted">
                            <a 
                              href={project.repository} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              Repository
                            </a>
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3" style={{ display: 'flex', gap: '10px' }}>
                      <Link
                        to={`/projects/${project._id}`}
                        className="btn btn-outline-primary btn-sm flex-fill text-center py-2"
                      >
                        View Details
                        <i className="bi bi-arrow-right ms-2"></i>
                      </Link>
                      
                      <button
                        className="btn-niceschool-primary btn-sm flex-fill text-center py-2"
                        onClick={() => {
                          navigate('/send-collaboration-request', {
                            state: {
                              project: project,
                              targetUser: project.owner
                            }
                          });
                        }}
                        title="Send collaboration request"
                      >
                          <i className="bi bi-handshake me-2"></i>
                          Collaborate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredProjects.length > itemsPerPage && (
          <div className="d-flex justify-content-center align-items-center gap-2 mt-4 mb-4">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            
            <div className="d-flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      className={`btn btn-sm ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        )}

        {/* Results Count */}
        {filteredProjects.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-muted">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProjects.length)} of {filteredProjects.length} projects
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;