/* eslint-disable unicode-bom */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ users: 500, projects: 1200, collaborations: 300 });

  useEffect(() => {
    fetchProjects();
    fetchStats();
    // Initialize AOS animations
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }, []);

  const handleResearchAreaClick = (researchArea) => {
    // Navigate to projects page with research area filter
    navigate('/projects', { state: { selectedResearchArea: researchArea } });
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects?limit=6');
      setProjects(res.data.data.projects || []);
    } catch (error) {
      console.error('Error:', error);
      // Provide mock data for Home page when server is down
      const mockProjects = [
        {
          _id: 'home-mock1',
          title: 'Machine Learning in Medicine',
          description: 'Developing advanced ML algorithms for medical diagnosis and treatment optimization.',
          researchArea: 'Artificial Intelligence',
          owner: { name: 'Dr. Emily Rodriguez' },
          createdAt: new Date('2024-01-15').toISOString()
        },
        {
          _id: 'home-mock2', 
          title: 'Climate Change Modeling',
          description: 'Advanced computational models for predicting climate patterns and environmental changes.',
          researchArea: 'Environmental Science',
          owner: { name: 'Prof. David Kim' },
          createdAt: new Date('2024-02-10').toISOString()
        },
        {
          _id: 'home-mock3',
          title: 'Blockchain Technology Research',
          description: 'Exploring secure and scalable blockchain solutions for various industry applications.',
          researchArea: 'Computer Science',
          owner: { name: 'Dr. Amanda Foster' },
          createdAt: new Date('2024-03-05').toISOString()
        }
      ];
      setProjects(mockProjects);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.data) {
        setStats({
          users: res.data.data.totalUsers || 500,
          projects: res.data.data.totalProjects || 1200,
          collaborations: res.data.data.totalCollaborations || 300
        });
      }
    } catch (error) {
      console.log('Using default stats');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery) {
      window.location.href = `/login?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="page-container">
      
      {/* Hero Section - NiceSchool Dark Style */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            
            {/* Left Content */}
            <div className="col-lg-7" data-aos="zoom-out" data-aos-delay="100">
              <div className="hero-content">
                <h1>
                  Empowering Research Through{' '}
                  <span className="gradient-text">Collaboration</span>
                </h1>
                <p>
                  Connect with fellow researchers across the university. Share knowledge, 
                  discover innovative projects, and collaborate to advance groundbreaking research 
                  that shapes the future.
                </p>
                <div className="cta-buttons">
                  {user ? (
                    <>
                      <Link to="/dashboard" className="btn-niceschool-primary">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Go to Dashboard
                      </Link>
                      <Link to="/projects/create" className="btn-niceschool-secondary">
                        <i className="bi bi-plus-circle me-2"></i>
                        Create Project
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="btn-niceschool-primary">
                        <i className="bi bi-person-plus me-2"></i>
                        Join as Researcher
                      </Link>
                      <Link to="/login" className="btn-niceschool-secondary">
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Stats Card */}
            <div className="col-lg-5" data-aos="zoom-out" data-aos-delay="200">
              <div className="stats-card">
                <div className="stats-header">
                  <h3>Why Choose Us</h3>
                  <div className="decoration-line"></div>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{stats.users}+</h4>
                      <p>Active Researchers</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bi bi-journal-text"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{stats.projects}+</h4>
                      <p>Research Projects</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{stats.collaborations}+</h4>
                      <p>Collaborations</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bi bi-building"></i>
                    </div>
                    <div className="stat-content">
                      <h4>50+</h4>
                      <p>Departments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-card" data-aos="fade-up">
            <h2 className="text-center mb-4" style={{ color: 'var(--heading-color)' }}>
              <i className="bi bi-search me-2"></i>
              Discover Research Projects
            </h2>
            <form onSubmit={handleSearch}>
              <div className="row g-3 align-items-center">
                <div className="col-12 col-md-9">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search by keywords, research areas, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <button type="submit" className="btn btn-search w-100">
                    <i className="bi bi-search me-2"></i>
                    Search
                  </button>
                </div>
              </div>
              <p className="text-center text-muted small mt-3 mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Sign in to access full search results and advanced filters
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Statistics Section with Gradient Cards */}
      <section className="statistics-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="100">
              <div className="stat-card-niceschool gradient-green">
                <i className="bi bi-people-fill"></i>
                <span className="stat-number">{stats.users}+</span>
                <span className="stat-label">Active Researchers</span>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="200">
              <div className="stat-card-niceschool gradient-cyan">
                <i className="bi bi-journal-text"></i>
                <span className="stat-number">{stats.projects}+</span>
                <span className="stat-label">Research Projects</span>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="300">
              <div className="stat-card-niceschool gradient-purple">
                <i className="bi bi-diagram-3-fill"></i>
                <span className="stat-number">{stats.collaborations}+</span>
                <span className="stat-label">Active Collaborations</span>
              </div>
            </div>
            <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="400">
              <div className="stat-card-niceschool gradient-pink">
                <i className="bi bi-building"></i>
                <span className="stat-number">50+</span>
                <span className="stat-label">Departments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas Section */}
      <section className="research-areas-section">
        <div className="container">
          <div className="section-title-niceschool" data-aos="fade-up">
            <h2>Key Research Areas</h2>
            <p>Explore cutting-edge research across multiple disciplines</p>
          </div>

          <div className="row g-4">
            <div className="col-6 col-md-3" data-aos="zoom-in" data-aos-delay="100">
              <div 
                className="research-card-niceschool"
                onClick={() => handleResearchAreaClick('Biotechnology')}
                role="button"
                tabIndex={0}
              >
                <div className="research-card-icon">
                  🧬
                </div>
                <h5>Life Sciences</h5>
                <p>Biology, Genetics, Biotechnology</p>
              </div>
            </div>

            <div className="col-6 col-md-3" data-aos="zoom-in" data-aos-delay="200">
              <div 
                className="research-card-niceschool"
                onClick={() => handleResearchAreaClick('Computer Science')}
                role="button"
                tabIndex={0}
              >
                <div className="research-card-icon">
                  💻
                </div>
                <h5>Computer Science</h5>
                <p>AI, ML, Data Science</p>
              </div>
            </div>

            <div className="col-6 col-md-3" data-aos="zoom-in" data-aos-delay="300">
              <div 
                className="research-card-niceschool"
                onClick={() => handleResearchAreaClick('Physics')}
                role="button"
                tabIndex={0}
              >
                <div className="research-card-icon">
                  ⚗️
                </div>
                <h5>Physical Sciences</h5>
                <p>Physics, Chemistry, Materials</p>
              </div>
            </div>

            <div className="col-6 col-md-3" data-aos="zoom-in" data-aos-delay="400">
              <div 
                className="research-card-niceschool"
                onClick={() => handleResearchAreaClick('Biomedical Engineering')}
                role="button"
                tabIndex={0}
              >
                <div className="research-card-icon">
                  🏥
                </div>
                <h5>Health Sciences</h5>
                <p>Medicine, Public Health</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="projects-section">
        <div className="container">
          <div className="section-title-niceschool" data-aos="fade-up">
            <h2>Featured Research Projects</h2>
            <p>Discover the latest innovative research from our community</p>
          </div>

          <div className="row g-4">
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <div key={project._id} className="col-md-6 col-lg-4" data-aos="zoom-in" data-aos-delay={index * 100}>
                  <div className="project-card-niceschool">
                    <div className="card-body">
                      <span className="badge mb-3">{project.researchArea || 'Research'}</span>
                      <h5>{project.title}</h5>
                      <p className="text-muted mb-3">
                        {project.description?.substring(0, 120)}
                        {project.description?.length > 120 ? '...' : ''}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          {project.owner?.name || 'Unknown'}
                        </small>
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <Link to={user ? `/projects/${project._id}` : '/login'} className="btn-link">
                        <span>View Details</span>
                        <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: 'var(--accent-color)' }}></i>
                  <h4 className="mt-3" style={{ color: 'var(--heading-color)' }}>No Projects Yet</h4>
                  <p className="text-muted">Be the first to create a research project!</p>
                  {user && (
                    <Link to="/projects/create" className="btn-niceschool-primary mt-3">
                      <i className="bi bi-plus-circle me-2"></i>
                      Create Your First Project
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {projects.length > 0 && (
            <div className="text-center mt-5" data-aos="fade-up">
              <Link to={user ? '/projects' : '/login'} className="btn-niceschool-primary">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                View All Projects
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="hero-section" style={{ minHeight: '60vh', padding: '100px 0' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center" data-aos="fade-up">
                <h2 className="display-4 fw-bold mb-4" style={{ color: '#ffffff' }}>
                  Ready to Start Your Research Journey?
                </h2>
                <p className="lead mb-5" style={{ color: '#ffffff', opacity: 0.9 }}>
                  Join our thriving community of researchers and make your mark in the world of academia.
                </p>
                <div className="cta-buttons justify-content-center">
                  <Link to="/register" className="btn-niceschool-primary">
                    <i className="bi bi-person-plus me-2"></i>
                    Join as Researcher
                  </Link>
                  <Link to="/login" className="btn-niceschool-secondary">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
