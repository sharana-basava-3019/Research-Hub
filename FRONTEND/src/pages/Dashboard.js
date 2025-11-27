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
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's projects
      const projectsRes = await api.get('/projects', {
        params: { owner: user.id, limit: 3 }
      });
      setRecentProjects(projectsRes.data.data.projects || []);
      
      // Fetch collaborations
      const collabRes = await api.get('/collaborations', {
        params: { limit: 5 }
      });
      setRecentCollaborations(collabRes.data.data.collaborations || []);
      
      // Fetch notifications
      const notifRes = await api.get('/notifications', {
        params: { limit: 5 }
      });
      setNotifications(notifRes.data.data.notifications || []);
      
      // Fetch upcoming events
      const eventsRes = await api.get('/events', {
        params: { upcoming: true, limit: 3 }
      });
      setUpcomingEvents(eventsRes.data.data.events || []);
      
      // Set stats
      setStats({
        projects: projectsRes.data.data.projects?.length || 0,
        collaborations: collabRes.data.count || 0,
        notifications: notifRes.data.unreadCount || 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'Accepted': 'success',
      'Rejected': 'danger',
      'Active': 'success',
      'Planning': 'info',
      'Completed': 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container section">
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            {user.institution} • {user.department || 'Research Hub'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card hover-lift">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-folder-fill text-2xl text-primary"></i>
              </div>
              <h3 className="text-3xl font-bold text-dark mb-1">{stats.projects}</h3>
              <p className="text-gray-600 text-sm">My Projects</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-people-fill text-2xl text-success"></i>
              </div>
              <h3 className="text-3xl font-bold text-dark mb-1">{stats.collaborations}</h3>
              <p className="text-gray-600 text-sm">Collaborations</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-bell-fill text-2xl text-warning"></i>
              </div>
              <h3 className="text-3xl font-bold text-dark mb-1">{stats.notifications}</h3>
              <p className="text-gray-600 text-sm">New Notifications</p>
            </div>
          </div>
          
          <div className="card hover-lift">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-calendar-event text-2xl text-info"></i>
              </div>
              <h3 className="text-3xl font-bold text-dark mb-1">{upcomingEvents.length}</h3>
              <p className="text-gray-600 text-sm">Upcoming Events</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/projects/create" className="btn-niceschool-primary">
                <i className="bi bi-plus-circle mr-2"></i>
                Create Project
              </Link>
              <Link to="/projects" className="btn btn-outline-primary">
                <i className="bi bi-search mr-2"></i>
                Browse Projects
              </Link>
              <Link to="/events" className="btn btn-outline-primary">
                <i className="bi bi-calendar mr-2"></i>
                View Events
              </Link>
              <Link to="/profile" className="btn btn-outline-primary">
                <i className="bi bi-person mr-2"></i>
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Recent Projects</h2>
              <Link to="/projects" className="text-primary hover:text-primary-dark text-sm">
                View All →
              </Link>
            </div>
            <div className="card-body">
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="block p-4 border border-gray-200 rounded-card hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-dark hover:text-primary">
                          {project.title}
                        </h3>
                        <span className={`badge badge-${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        <i className="bi bi-calendar mr-1"></i>
                        {formatDate(project.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-folder text-4xl mb-2"></i>
                  <p>No projects yet</p>
                  <Link to="/projects/create" className="text-primary hover:text-primary-dark text-sm">
                    Create your first project →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Collaborations */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Collaboration Requests</h2>
              <Link to="/collaborations" className="text-primary hover:text-primary-dark text-sm">
                View All →
              </Link>
            </div>
            <div className="card-body">
              {recentCollaborations.length > 0 ? (
                <div className="space-y-3">
                  {recentCollaborations.map((collab) => (
                    <div
                      key={collab._id}
                      className="p-3 border border-gray-200 rounded-card"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary text-sm font-semibold">
                            {collab.sender?.firstName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {collab.sender?.firstName} {collab.sender?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {collab.sender?.institution}
                            </p>
                          </div>
                        </div>
                        <span className={`badge badge-${getStatusColor(collab.status)} text-xs`}>
                          {collab.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{collab.project?.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-people text-4xl mb-2"></i>
                  <p>No collaboration requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Notifications</h2>
              <Link to="/notifications" className="text-primary hover:text-primary-dark text-sm">
                View All →
              </Link>
            </div>
            <div className="card-body">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-card border ${
                        notif.isRead ? 'border-gray-200 bg-white' : 'border-primary bg-primary-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-bell text-4xl mb-2"></i>
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              <Link to="/events" className="text-primary hover:text-primary-dark text-sm">
                View All →
              </Link>
            </div>
            <div className="card-body">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event._id}
                      to={`/events/${event._id}`}
                      className="block p-4 border border-gray-200 rounded-card hover:border-primary transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-semibold">
                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {new Date(event.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark hover:text-primary mb-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">
                            <i className="bi bi-geo-alt mr-1"></i>
                            {event.location?.venue || 'Virtual'}
                          </p>
                          <span className="badge badge-info text-xs">{event.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-calendar-event text-4xl mb-2"></i>
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;