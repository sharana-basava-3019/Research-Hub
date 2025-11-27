import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
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
    <div className="bg-light min-h-screen py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-dark mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your latest activities and announcements
          </p>
        </div>

        {/* Stats & Actions */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-2xl font-bold text-primary">{unreadCount}</span>
                <span className="text-gray-600 ml-2">unread notifications</span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="bi bi-check-all mr-2"></i>
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${
                  filter === 'all' ? 'btn-primary' : 'btn-outline-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`btn btn-sm ${
                  filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 badge badge-light">{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`btn btn-sm ${
                  filter === 'read' ? 'btn-primary' : 'btn-outline-primary'
                }`}
              >
                Read
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`card hover:shadow-lg transition-shadow ${
                  !notification.isRead ? 'bg-primary-50 border-l-4 border-primary' : ''
                }`}
              >
                <div className="card-body">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 bg-${getNotificationColor(
                        notification.type
                      )}-100 rounded-full flex items-center justify-center`}
                    >
                      <i
                        className={`${getNotificationIcon(notification.type)} text-${getNotificationColor(
                          notification.type
                        )} text-xl`}
                      ></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-dark mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                        </div>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-3 h-3 bg-primary rounded-full ml-2"></span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-xs text-gray-500">
                          <i className="bi bi-clock mr-1"></i>
                          {formatDate(notification.createdAt)}
                        </span>

                        {notification.priority !== 'normal' && (
                          <span
                            className={`badge badge-${
                              notification.priority === 'urgent'
                                ? 'danger'
                                : notification.priority === 'high'
                                ? 'warning'
                                : 'info'
                            } text-xs`}
                          >
                            {notification.priority}
                          </span>
                        )}

                        {/* Actions */}
                        <div className="ml-auto flex gap-2">
                          {notification.link && (
                            <Link
                              to={notification.link}
                              className="text-primary hover:text-primary-dark text-sm font-medium"
                            >
                              View Details →
                            </Link>
                          )}
                          
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                              title="Mark as read"
                            >
                              <i className="bi bi-check2"></i>
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-gray-600 hover:text-danger text-sm"
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <i className="bi bi-bell-slash text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'You have no notifications yet'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
