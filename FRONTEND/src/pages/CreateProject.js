import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchArea: '',
    status: 'Planning',
    visibility: 'Public',
    startDate: '',
    endDate: '',
    fundingAmount: '',
    fundingSource: '',
    keywords: '',
    objectives: '',
    methodology: '',
    expectedOutcomes: '',
    repository: '',
    documentation: ''
  });

  const researchAreas = [
    'Computer Science',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cybersecurity',
    'Software Engineering',
    'Biotechnology',
    'Biomedical Engineering',
    'Environmental Science',
    'Climate Change',
    'Renewable Energy',
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Marine Biology',
    'Neuroscience',
    'Psychology',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a project');
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    if (!formData.researchArea) {
      toast.error('Research area is required');
      return;
    }

    try {
      setLoading(true);

      // Process arrays from comma-separated strings
      const projectData = {
        ...formData,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        objectives: formData.objectives ? formData.objectives.split('\n').map(o => o.trim()).filter(o => o) : [],
        expectedOutcomes: formData.expectedOutcomes ? formData.expectedOutcomes.split('\n').map(o => o.trim()).filter(o => o) : [],
        fundingAmount: formData.fundingAmount ? parseFloat(formData.fundingAmount) : undefined
      };

      // Remove empty fields and empty arrays
      Object.keys(projectData).forEach(key => {
        if (projectData[key] === '' || 
            projectData[key] === undefined || 
            projectData[key] === null ||
            (Array.isArray(projectData[key]) && projectData[key].length === 0)) {
          delete projectData[key];
        }
      });

      console.log('Sending project data:', projectData);
      const response = await api.post('/projects', projectData);
      console.log('Project created response:', response.data);
      
      toast.success('Project created successfully!');
      
      // Navigate to the new project details page where files can be uploaded
      const projectId = response.data.data.project._id;
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create project';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container section text-center">
        <i className="bi bi-lock display-1 text-warning"></i>
        <h3 className="mt-3">Authentication Required</h3>
        <p className="text-muted">You must be logged in to create a project.</p>
        <Link to="/login" className="btn btn-primary mt-3">
          Login
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

      {/* Breadcrumb */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <p className="text-muted mb-0">
            <Link to="/" className="text-decoration-none text-muted">Home</Link>
            {' > '}
            <Link to="/projects" className="text-decoration-none text-muted">Projects</Link>
            {' > '}
            <span className="text-dark fw-semibold">Create New Project</span>
          </p>
        </nav>
      </div>

      {/* Page Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-5 fw-bold">Create New Project</h1>
          <p className="text-muted">Fill in the details below to create your research project.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* Basic Information Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-info-circle text-primary me-2"></i>
                  Basic Information
                </h5>

                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Project Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter project title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide a detailed description of your project"
                    required
                  ></textarea>
                </div>

                {/* Research Area & Status */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="researchArea" className="form-label">
                      Research Area <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="researchArea"
                      name="researchArea"
                      value={formData.researchArea}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select research area</option>
                      {researchAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="status" className="form-label">
                      Project Status
                    </label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>

                {/* Keywords */}
                <div className="mb-3">
                  <label htmlFor="keywords" className="form-label">
                    Keywords
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    placeholder="Enter keywords separated by commas (e.g., AI, Machine Learning, Healthcare)"
                  />
                  <small className="text-muted">Separate multiple keywords with commas</small>
                </div>
              </div>
            </div>

            {/* Research Details Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-clipboard-data text-primary me-2"></i>
                  Research Details
                </h5>

                {/* Objectives */}
                <div className="mb-3">
                  <label htmlFor="objectives" className="form-label">
                    Objectives
                  </label>
                  <textarea
                    className="form-control"
                    id="objectives"
                    name="objectives"
                    rows="4"
                    value={formData.objectives}
                    onChange={handleChange}
                    placeholder="Enter each objective on a new line"
                  ></textarea>
                  <small className="text-muted">Enter one objective per line</small>
                </div>

                {/* Methodology */}
                <div className="mb-3">
                  <label htmlFor="methodology" className="form-label">
                    Methodology
                  </label>
                  <textarea
                    className="form-control"
                    id="methodology"
                    name="methodology"
                    rows="4"
                    value={formData.methodology}
                    onChange={handleChange}
                    placeholder="Describe the research methodology"
                  ></textarea>
                </div>

                {/* Expected Outcomes */}
                <div className="mb-3">
                  <label htmlFor="expectedOutcomes" className="form-label">
                    Expected Outcomes
                  </label>
                  <textarea
                    className="form-control"
                    id="expectedOutcomes"
                    name="expectedOutcomes"
                    rows="4"
                    value={formData.expectedOutcomes}
                    onChange={handleChange}
                    placeholder="Enter each expected outcome on a new line"
                  ></textarea>
                  <small className="text-muted">Enter one outcome per line</small>
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-link-45deg text-primary me-2"></i>
                  Resources & Links
                </h5>

                {/* Repository */}
                <div className="mb-3">
                  <label htmlFor="repository" className="form-label">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="repository"
                    name="repository"
                    value={formData.repository}
                    onChange={handleChange}
                    placeholder="https://github.com/username/repository"
                  />
                </div>

                {/* Documentation */}
                <div className="mb-3">
                  <label htmlFor="documentation" className="form-label">
                    Documentation URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="documentation"
                    name="documentation"
                    value={formData.documentation}
                    onChange={handleChange}
                    placeholder="https://docs.example.com/project"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Timeline Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="bi bi-calendar text-primary me-2"></i>
                  Timeline
                </h5>

                {/* Start Date */}
                <div className="mb-3">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                {/* End Date */}
                <div className="mb-3">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Funding Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="bi bi-cash-stack text-primary me-2"></i>
                  Funding
                </h5>

                {/* Funding Amount */}
                <div className="mb-3">
                  <label htmlFor="fundingAmount" className="form-label">
                    Funding Amount ($)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="fundingAmount"
                    name="fundingAmount"
                    value={formData.fundingAmount}
                    onChange={handleChange}
                    placeholder="150000"
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Funding Source */}
                <div className="mb-3">
                  <label htmlFor="fundingSource" className="form-label">
                    Funding Source
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fundingSource"
                    name="fundingSource"
                    value={formData.fundingSource}
                    onChange={handleChange}
                    placeholder="e.g., NSF Grant, University Fund"
                  />
                </div>
              </div>
            </div>

            {/* Visibility Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="bi bi-eye text-primary me-2"></i>
                  Visibility
                </h5>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="visibility"
                    id="visibilityPublic"
                    value="Public"
                    checked={formData.visibility === 'Public'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="visibilityPublic">
                    <i className="bi bi-globe me-1"></i> Public
                    <small className="d-block text-muted">Anyone can view this project</small>
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="visibility"
                    id="visibilityPrivate"
                    value="Private"
                    checked={formData.visibility === 'Private'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="visibilityPrivate">
                    <i className="bi bi-lock me-1"></i> Private
                    <small className="d-block text-muted">Only you and collaborators can view</small>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Create Project
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/projects')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;