import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Analytics = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommendations'); // recommendations, trends, dashboard
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'recommendations') {
        const response = await api.get('/analytics/recommendations');
        setRecommendations(response.data.data?.recommendations || response.data.recommendations || []);
      } else if (activeTab === 'trends') {
        const response = await api.get('/analytics/trends');
        setTrends(response.data.data?.trends || response.data.trends || []);
      } else if (activeTab === 'dashboard') {
        const response = await api.get('/analytics/dashboard');
        setDashboard(response.data.data?.dashboard || response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container section text-center">
        <i className="bi bi-lock display-1 text-warning"></i>
        <h3 className="mt-3">Authentication Required</h3>
        <p className="text-muted">Please log in to view analytics.</p>
        <Link to="/login" className="btn btn-primary mt-3">Login</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-5 fw-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted">Track trends, analyze keywords, and gain insights from research data</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                <i className="bi bi-people me-2"></i>
                Find Collaborators
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                onClick={() => setActiveTab('trends')}
              >
                <i className="bi bi-graph-up me-2"></i>
                Trending Topics
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div>
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                AI-powered recommendations to connect with researchers sharing similar interests
              </div>
              
              {recommendations.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people display-1 text-muted"></i>
                  <h4 className="mt-3">No recommendations available</h4>
                  <p className="text-muted">Add research interests to your profile to get personalized recommendations</p>
                </div>
              ) : (
                <div className="row">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="col-md-6 mb-4">
                      <div className="card shadow-sm hover-lift h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className="me-3">
                              {rec.user?.profilePicture ? (
                                <img
                                  src={rec.user.profilePicture}
                                  alt={`${rec.user.firstName} ${rec.user.lastName}`}
                                  className="rounded-circle"
                                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: '60px', height: '60px', fontSize: '24px' }}
                                >
                                  {rec.user?.firstName?.[0]}{rec.user?.lastName?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-semibold">
                                {rec.user?.firstName} {rec.user?.lastName}
                              </h5>
                              <small className="text-muted">
                                {rec.user?.institution}
                                {rec.user?.department && ` • ${rec.user.department}`}
                              </small>
                            </div>
                            <div>
                              <div className="badge bg-success fs-6">
                                {rec.matchPercentage}% Match
                              </div>
                            </div>
                          </div>

                          {/* Matching Interests */}
                          {rec.matchingInterests && rec.matchingInterests.length > 0 && (
                            <div className="mb-3">
                              <small className="text-muted fw-semibold d-block mb-2">
                                Matching Interests:
                              </small>
                              <div className="d-flex flex-wrap gap-2">
                                {rec.matchingInterests.map((interest, idx) => (
                                  <span key={idx} className="badge bg-primary">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All Research Interests */}
                          {rec.user?.researchInterests && rec.user.researchInterests.length > 0 && (
                            <div className="mb-3">
                              <small className="text-muted fw-semibold d-block mb-2">
                                Research Interests:
                              </small>
                              <div className="d-flex flex-wrap gap-2">
                                {rec.user.researchInterests.map((interest, idx) => (
                                  <span key={idx} className="badge bg-light text-dark border">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary flex-grow-1"
                              onClick={() => {
                                navigate('/send-collaboration-request', {
                                  state: {
                                    targetUser: rec.user
                                  }
                                });
                              }}
                            >
                              <i className="bi bi-handshake me-1"></i>
                              Collaborate
                            </button>
                            <Link
                              to={`/users/${rec.user?.id || rec.user?._id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-person"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div>
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Discover trending research topics and popular keywords
              </div>

              {trends.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-graph-up display-1 text-muted"></i>
                  <h4 className="mt-3">No trending data available</h4>
                  <p className="text-muted">Check back later for trending topics</p>
                </div>
              ) : (
                <div className="row">
                  {trends.map((trend, index) => (
                    <div key={index} className="col-md-4 mb-4">
                      <div className="card shadow-sm hover-lift h-100">
                        <div className="card-body text-center">
                          <div className="display-6 fw-bold text-primary mb-2">
                            #{index + 1}
                          </div>
                          <h5 className="mb-3">{trend.keyword || trend.topic}</h5>
                          <div className="mb-3">
                            <span className="badge bg-primary fs-6">
                              {trend.count || trend.frequency} mentions
                            </span>
                          </div>
                          {trend.researchAreas && trend.researchAreas.length > 0 && (
                            <div>
                              <small className="text-muted d-block mb-2">Related Areas:</small>
                              <div className="d-flex flex-wrap gap-2 justify-content-center">
                                {trend.researchAreas.slice(0, 3).map((area, idx) => (
                                  <span key={idx} className="badge bg-light text-dark border">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && dashboard && (
            <div>
              <div className="row mb-4">
                {/* Projects Stats */}
                <div className="col-md-3 mb-4">
                  <div className="card shadow-sm text-center">
                    <div className="card-body">
                      <i className="bi bi-folder display-4 text-primary mb-2"></i>
                      <h3 className="mb-1">{dashboard.projects?.total || 0}</h3>
                      <p className="text-muted mb-0">Total Projects</p>
                    </div>
                  </div>
                </div>

                {/* Users Stats */}
                <div className="col-md-3 mb-4">
                  <div className="card shadow-sm text-center">
                    <div className="card-body">
                      <i className="bi bi-people display-4 text-success mb-2"></i>
                      <h3 className="mb-1">{dashboard.users?.total || 0}</h3>
                      <p className="text-muted mb-0">Total Users</p>
                    </div>
                  </div>
                </div>

                {/* Collaborations Stats */}
                <div className="col-md-3 mb-4">
                  <div className="card shadow-sm text-center">
                    <div className="card-body">
                      <i className="bi bi-handshake display-4 text-info mb-2"></i>
                      <h3 className="mb-1">{dashboard.collaborations?.total || 0}</h3>
                      <p className="text-muted mb-0">Collaborations</p>
                    </div>
                  </div>
                </div>

                {/* Research Areas Stats */}
                <div className="col-md-3 mb-4">
                  <div className="card shadow-sm text-center">
                    <div className="card-body">
                      <i className="bi bi-bookmark display-4 text-warning mb-2"></i>
                      <h3 className="mb-1">{dashboard.researchAreas?.length || 0}</h3>
                      <p className="text-muted mb-0">Research Areas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects by Status */}
              {dashboard.projects?.byStatus && (
                <div className="card shadow-sm mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-bar-chart me-2"></i>
                      Projects by Status
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(dashboard.projects.byStatus).map(([status, count]) => (
                        <div key={status} className="col-md-3 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{status}</h6>
                            </div>
                            <div className="badge bg-primary fs-6">{count}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborations by Status */}
              {dashboard.collaborations?.byStatus && (
                <div className="card shadow-sm">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-bar-chart me-2"></i>
                      Collaborations by Status
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(dashboard.collaborations.byStatus).map(([status, count]) => (
                        <div key={status} className="col-md-3 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{status}</h6>
                            </div>
                            <div className="badge bg-success fs-6">{count}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;