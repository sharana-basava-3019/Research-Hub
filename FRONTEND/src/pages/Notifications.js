import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      const handleRealtimeNotif = (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('new_notification', handleRealtimeNotif);
      return () => {
        socket.off('new_notification', handleRealtimeNotif);
      };
    }
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter === 'unread') {
        params.isRead = false;
      } else if (filter === 'read') {
        params.isRead = true;
      }

      const res = await api.get('/notifications', { params });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      COLLABORATION_REQUEST: 'bi-people-fill',
      COLLABORATION_ACCEPTED: 'bi-check-circle-fill',
      COLLABORATION_REJECTED: 'bi-x-circle-fill',
      COLLABORATION_REVOKED: 'bi-person-x-fill',
      COLLABORATOR_REMOVED: 'bi-person-x-fill',
      COLLABORATION_EXITED: 'bi-box-arrow-right',
      COLLABORATOR_LEFT: 'bi-box-arrow-right',
      PROJECT_INVITE: 'bi-folder-fill',
      COMMENT: 'bi-chat-fill',
      EVENT_REMINDER: 'bi-calendar-event',
      DEADLINE_REMINDER: 'bi-clock-fill',
      SYSTEM_ANNOUNCEMENT: 'bi-megaphone-fill',
      NEW_FOLLOWER: 'bi-person-plus-fill',
      PROJECT_UPDATE: 'bi-arrow-repeat'
    };
    return icons[type] || 'bi-bell-fill';
  };

  const getNotificationColor = (type) => {
    const colors = {
      COLLABORATION_ACCEPTED: 'success',
      COLLABORATION_REJECTED: 'danger',
      COLLABORATION_REVOKED: 'danger',
      COLLABORATOR_REMOVED: 'danger',
      COLLABORATION_EXITED: 'warning',
      COLLABORATOR_LEFT: 'warning',
      EVENT_REMINDER: 'info',
      DEADLINE_REMINDER: 'warning',
      SYSTEM_ANNOUNCEMENT: 'primary'
    };
    return colors[type] || 'primary';
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMs = now - notifDate;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return notifDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notifDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="container section">
      {/* Header */}
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">
            <i className="bi bi-bell me-2"></i>
            Notifications
          </h1>
          <p className="ds-page-subtitle">Stay updated with your latest activities and announcements</p>
        </div>
        <div className="ds-page-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-check-all me-2"></i>
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Unread count + filter pills */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-accent)' }}>{unreadCount}</span>
          {' '}unread notifications
        </div>
        <div className="ds-tab-pills">
          <button className={`ds-tab-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`ds-tab-pill${filter === 'unread' ? ' active' : ''}`} onClick={() => setFilter('unread')}>
            Unread {unreadCount > 0 && <span className="badge bg-primary ms-1" style={{ borderRadius: '999px' }}>{unreadCount}</span>}
          </button>
          <button className={`ds-tab-pill${filter === 'read' ? ' active' : ''}`} onClick={() => setFilter('read')}>Read</button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="ds-loading"><div className="ds-spinner"></div></div>
      ) : notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((notification) => (
            <div key={notification._id} className={`ds-feed-item${!notification.isRead ? ' unread' : ''}`}>
              <div className={`ds-feed-icon ${getNotificationColor(notification.type)}`}>
                <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
              </div>
              <div className="ds-feed-content">
                <div className="ds-feed-title d-flex align-items-center gap-2">
                  <span>{notification.title}</span>
                  {(notification.type === 'COLLABORATION_REVOKED' || notification.type === 'COLLABORATOR_REMOVED') && (
                    <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 'var(--font-label)', fontWeight: 700 }}>
                      REVOCATION ALERT
                    </span>
                  )}
                  {(notification.type === 'COLLABORATION_EXITED' || notification.type === 'COLLABORATOR_LEFT') && (
                    <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontSize: 'var(--font-label)', fontWeight: 700 }}>
                      MEMBER EXIT
                    </span>
                  )}
                </div>
                {(notification.type === 'COLLABORATION_REVOKED' || notification.type === 'COLLABORATOR_REMOVED') ? (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#991b1b',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      marginTop: '6px',
                      marginBottom: '4px'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-1.5 text-danger" />
                    {notification.message}
                  </div>
                ) : (notification.type === 'COLLABORATION_EXITED' || notification.type === 'COLLABORATOR_LEFT') ? (
                  <div
                    style={{
                      backgroundColor: '#fff7ed',
                      color: '#9a3412',
                      border: '1px solid #ffedd5',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      marginTop: '6px',
                      marginBottom: '4px'
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-1.5 text-warning" />
                    {notification.message}
                  </div>
                ) : (
                  <div className="ds-feed-body">{notification.message}</div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <span className="ds-feed-time">
                    <i className="bi bi-clock me-1"></i>
                    {formatDate(notification.createdAt)}
                  </span>
                  {notification.priority && notification.priority !== 'normal' && (
                    <span className={`badge bg-${notification.priority === 'urgent' ? 'danger' : notification.priority === 'high' ? 'warning' : 'info'}`}>
                      {notification.priority}
                    </span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {notification.link && (
                      <Link to={notification.link} className="ds-btn-link">
                        View Details <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    )}
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="btn btn-outline-primary btn-sm btn-icon"
                        title="Mark as read"
                      >
                        <i className="bi bi-check2"></i>
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="btn btn-outline-danger btn-sm btn-icon"
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ds-empty">
          <div className="ds-empty-icon"><i className="bi bi-bell-slash"></i></div>
          <h3>No notifications</h3>
          <p>
            {filter === 'unread' ? "You're all caught up!" : filter === 'read' ? 'No read notifications' : 'You have no notifications yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
