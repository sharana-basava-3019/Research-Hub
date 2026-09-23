import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    collaborations: 0,
    notifications: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentCollaborations, setRecentCollaborations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;

      // Fetch all dashboard data in parallel (faster, avoids sequential rate-limit exhaustion)
      const [projectsRes, collabRes, notifRes] = await Promise.all([
        api.get('/projects', { params: { owner: userId, limit: 6 } }),
        api.get('/collaborations', { params: { limit: 5 } }),
        api.get('/notifications', { params: { limit: 5 } }),
      ]);

      const userProjects = projectsRes.data.data?.projects || projectsRes.data?.projects || [];
      const collabs = collabRes.data.data?.collaborations || [];
      const notifs = notifRes.data.data?.notifications || [];

      setRecentProjects(userProjects);
      setRecentCollaborations(collabs);
      setNotifications(notifs);
      setStats({
        projects: userProjects.length,
        collaborations: collabs.length,
        notifications: notifRes.data?.unreadCount || notifs.filter(n => !n.isRead).length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard metrics', { toastId: 'dashboard-error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="ds-loading">
            <div className="ds-spinner" />
            <p>Loading research workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCollabs = recentCollaborations.filter(c => c.status === 'Pending');

  return (
    <div className="page-container">
      <div className="container">
        {/* Workspace Header */}
        <div className="rh-page-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="label-overline mb-1">Research Workspace</div>
            <h1>Welcome back, {user?.firstName || 'Researcher'}</h1>
            <p>
              {user?.institution || 'Academic Scholar'} • {user?.department || user?.designation || 'Faculty'}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <Link to="/plagiarism" className="btn btn-outline-secondary">
              <i className="bi bi-shield-check me-1" />
              Plagiarism Check
            </Link>
            <Link to="/projects/create" className="btn btn-primary">
              <i className="bi bi-plus-lg me-1" />
              New Project
            </Link>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="ds-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="ds-stat-value">{stats.projects}</div>
                <div className="ds-stat-label">Active Projects</div>
              </div>
              <div className="ds-stat-icon ds-icon-blue">
                <i className="bi bi-folder2-open" />
              </div>
            </div>
          </div>

          <div className="ds-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="ds-stat-value">{stats.collaborations}</div>
                <div className="ds-stat-label">Collaborations</div>
              </div>
              <div className="ds-stat-icon ds-icon-green">
                <i className="bi bi-people" />
              </div>
            </div>
          </div>

          <div className="ds-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="ds-stat-value">{pendingCollabs.length}</div>
                <div className="ds-stat-label">Pending Requests</div>
              </div>
              <div className="ds-stat-icon ds-icon-amber">
                <i className="bi bi-hourglass-split" />
              </div>
            </div>
          </div>

          <div className="ds-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="ds-stat-value">{stats.notifications}</div>
                <div className="ds-stat-label">Unread Alerts</div>
              </div>
              <div className="ds-stat-icon ds-icon-info">
                <i className="bi bi-bell" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Projects, Right Secondary Panels */}
        <div className="rh-dashboard-grid">
          {/* Left Column: My Projects */}
          <div className="rh-dashboard-main">
            <div className="card shadow-xs mb-6">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bi bi-folder2 text-primary" />
                  <span>My Recent Projects</span>
                </div>
                <Link to="/projects" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                  View Catalog <i className="bi bi-arrow-right ms-1" />
                </Link>
              </div>

              <div className="card-body p-0">
                {recentProjects.length === 0 ? (
                  <div className="ds-empty p-6">
                    <div className="ds-empty-icon"><i className="bi bi-folder-plus" /></div>
                    <h4>No active projects published</h4>
                    <p>Start your research journey by creating your first paper draft or project record.</p>
                    <Link to="/projects/create" className="btn btn-primary btn-sm mt-3">
                      <i className="bi bi-plus-lg me-1" /> Create Project
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recentProjects.map((project) => (
                      <div
                        key={project._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--color-border)',
                          gap: 16
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="status-pill status-progress" style={{ fontSize: '0.7rem' }}>
                              {project.status || 'Active'}
                            </span>
                            {project.is_verified && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                <i className="bi bi-patch-check-fill" /> Verified
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                              {project.researchArea}
                            </span>
                          </div>
                          <Link
                            to={`/projects/${project._id}`}
                            style={{
                              fontSize: '0.9375rem',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                              textDecoration: 'none',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {project.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/edit/${project._id}`}
                            className="btn btn-ghost btn-sm"
                            title="Edit project"
                          >
                            <i className="bi bi-pencil" />
                          </Link>
                          <Link
                            to={`/projects/${project._id}`}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Collaborations */}
            <div className="card shadow-xs">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bi bi-people text-primary" />
                  <span>Recent Collaborations</span>
                </div>
                <Link to="/collaborations" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                  Manage All <i className="bi bi-arrow-right ms-1" />
                </Link>
              </div>

              <div className="card-body p-0">
                {recentCollaborations.length === 0 ? (
                  <div className="ds-empty p-5">
                    <div className="ds-empty-icon" style={{ fontSize: '1.75rem' }}><i className="bi bi-person-plus" /></div>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>No active collaboration requests.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recentCollaborations.slice(0, 4).map((collab) => (
                      <div
                        key={collab._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--color-border)',
                          gap: 12
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {collab.project?.title || 'Research Collaboration'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                            Role: {collab.proposedRole || collab.role || 'Contributor'} • Status: <strong style={{ color: collab.status === 'Pending' ? 'var(--color-warning)' : 'var(--color-success)' }}>{collab.status}</strong>
                          </div>
                        </div>
                        <Link to="/collaborations" className="btn btn-ghost btn-sm">
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions & Feeds */}
          <div className="rh-dashboard-side">
            {/* Quick Actions Card */}
            <div className="card shadow-xs mb-6">
              <div className="card-header">
                <i className="bi bi-lightning-charge text-primary me-1" /> Quick Actions
              </div>
              <div className="card-body p-3 flex flex-col gap-2">
                <Link
                  to="/projects/create"
                  className="rh-quick-action-btn"
                >
                  <i className="bi bi-plus-circle text-primary" />
                  <span>Publish New Project</span>
                </Link>

                <Link
                  to="/upload"
                  className="rh-quick-action-btn"
                >
                  <i className="bi bi-cloud-upload text-info" />
                  <span>Upload Project Files</span>
                </Link>

                <Link
                  to="/plagiarism"
                  className="rh-quick-action-btn"
                >
                  <i className="bi bi-shield-check text-success" />
                  <span>Check Document Plagiarism</span>
                </Link>

                {user?.designation === 'Professor' && (
                  <Link
                    to="/verification-requests"
                    className="rh-quick-action-btn"
                  >
                    <i className="bi bi-patch-check text-warning" />
                    <span>Faculty Verification Queue</span>
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="rh-quick-action-btn"
                  >
                    <i className="bi bi-shield-lock text-danger" />
                    <span>Admin User Management</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Notifications Feed Card */}
            <div className="card shadow-xs">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bi bi-bell text-primary" />
                  <span>Activity Feed</span>
                </div>
                <Link to="/notifications" style={{ fontSize: '0.8125rem' }}>
                  All
                </Link>
              </div>
              <div className="card-body p-0">
                {notifications.length === 0 ? (
                  <div className="ds-empty p-4">
                    <p style={{ margin: 0, fontSize: '0.8125rem' }}>No recent notifications.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.slice(0, 4).map((notif) => (
                      <div
                        key={notif._id}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: '0.8125rem',
                          background: notif.isRead ? 'transparent' : 'var(--color-accent-bg)'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {notif.title}
                        </div>
                        <div style={{ color: 'var(--color-text-2)', marginTop: 2 }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', marginTop: 4 }}>
                          {formatDate(notif.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;