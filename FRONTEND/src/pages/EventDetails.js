import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data.event);
      
      // Check if user is registered
      if (user && res.data.data.event.registrations) {
        const registered = res.data.data.event.registrations.some(
          reg => reg.user._id === user.id || reg.user === user.id
        );
        setIsRegistered(registered);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async () => {
    if (!user) {
      toast.info('Please login to register for events');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/events/${id}/register`);
      toast.success('Successfully registered for event!');
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  const cancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;

    try {
      await api.delete(`/events/${id}/register`);
      toast.success('Registration cancelled');
      fetchEventDetails();
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Workshop: 'success',
      Conference: 'info',
      Competition: 'danger'
    };
    return colors[cat] || 'primary';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      Published: 'success',
      Draft: 'warning',
      Cancelled: 'danger',
      Completed: 'secondary'
    };
    return colors[status] || 'primary';
  };

  if (loading) {
    return (
      <div className="bg-light min-h-screen py-8">
        <div className="container">
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const isPastEvent = new Date(event.endDate) < new Date();
  const isRegistrationOpen = event.isRegistrationOpen && !isPastEvent;
  const isFull = event.capacity && event.registrationCount >= event.capacity;

  return (
    <div className="bg-light min-h-screen py-8">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><i className="bi bi-chevron-right"></i></li>
            <li><Link to="/events" className="hover:text-primary">Events</Link></li>
            <li><i className="bi bi-chevron-right"></i></li>
            <li className="text-dark">{event.title}</li>
          </ol>
        </nav>

        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Event Header */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`badge badge-${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                  <span className={`badge badge-${getStatusBadgeColor(event.status)}`}>
                    {event.status}
                  </span>
                  {isRegistered && (
                    <span className="badge badge-success">
                      <i className="bi bi-check-circle mr-1"></i>
                      Registered
                    </span>
                  )}
                  {isPastEvent && (
                    <span className="badge badge-secondary">
                      <i className="bi bi-clock-history mr-1"></i>
                      Past Event
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-dark mb-4">{event.title}</h1>

                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <i className="bi bi-calendar-event mr-2 text-primary"></i>
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <i className="bi bi-clock mr-2 text-primary"></i>
                    <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <i className={`bi ${event.location?.type === 'Virtual' ? 'bi-camera-video' : event.location?.type === 'Hybrid' ? 'bi-hybrid' : 'bi-geo-alt'} mr-2 text-primary`}></i>
                    <span>{event.location?.type || 'TBD'}</span>
                  </div>
                </div>

                {event.organizer && (
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <i className="bi bi-person text-primary"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Organized by</p>
                      <p className="font-semibold text-dark">
                        {event.organizer.firstName} {event.organizer.lastName}
                      </p>
                      {event.organizer.institution && (
                        <p className="text-sm text-gray-600">{event.organizer.institution}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Description */}
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-dark mb-3">About This Event</h2>
                <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
              </div>
            </div>

            {/* Topics */}
            {event.topics && event.topics.length > 0 && (
              <div className="card mb-4">
                <div className="card-body">
                  <h2 className="text-xl font-semibold text-dark mb-3">Topics Covered</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.topics.map((topic, index) => (
                      <span key={index} className="badge badge-light border">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="card mb-4">
                <div className="card-body">
                  <h2 className="text-xl font-semibold text-dark mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="badge badge-secondary">
                        <i className="bi bi-tag mr-1"></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Registration Card */}
            <div className="card mb-4 sticky-top" style={{ top: '20px' }}>
              <div className="card-body">
                <h3 className="text-lg font-semibold text-dark mb-4">Registration</h3>

                {/* Capacity */}
                {event.capacity && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Participants</span>
                      <span className="font-semibold">
                        {event.registrationCount || 0} / {event.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isFull ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${Math.min(((event.registrationCount || 0) / event.capacity) * 100, 100)}%` }}
                      ></div>
                    </div>
                    {isFull && (
                      <p className="text-danger text-sm mt-2">
                        <i className="bi bi-exclamation-circle mr-1"></i>
                        Event is full
                      </p>
                    )}
                  </div>
                )}

                {/* Registration Deadline */}
                {event.registrationDeadline && !isPastEvent && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Registration Deadline</p>
                    <p className="font-semibold text-dark">
                      {formatDate(event.registrationDeadline)}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {user ? (
                  <div className="space-y-2">
                    {!isPastEvent && (
                      <>
                        {isRegistered ? (
                          <button
                            onClick={cancelRegistration}
                            className="btn btn-outline-danger w-full"
                          >
                            <i className="bi bi-x-circle mr-2"></i>
                            Cancel Registration
                          </button>
                        ) : (
                          <button
                            onClick={registerForEvent}
                            className="btn btn-primary w-full"
                            disabled={!isRegistrationOpen || isFull}
                          >
                            <i className="bi bi-calendar-check mr-2"></i>
                            {isFull ? 'Event Full' : 'Register Now'}
                          </button>
                        )}
                      </>
                    )}
                    {(user.role === 'admin' || (event.organizer && event.organizer._id === user.id)) && (
                      <Link
                        to={`/events/edit/${event._id}`}
                        className="btn btn-outline-primary w-full"
                      >
                        <i className="bi bi-pencil mr-2"></i>
                        Edit Event
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="btn btn-primary w-full">
                    <i className="bi bi-box-arrow-in-right mr-2"></i>
                    Login to Register
                  </Link>
                )}
              </div>
            </div>

            {/* Location Details */}
            {event.location && (
              <div className="card mb-4">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-dark mb-3">
                    <i className={`bi ${event.location.type === 'Virtual' ? 'bi-camera-video' : 'bi-geo-alt'} mr-2 text-primary`}></i>
                    Location
                  </h3>
                  
                  {event.location.type === 'Virtual' ? (
                    <>
                      <p className="text-gray-700 mb-2">This is a virtual event</p>
                      {event.location.virtualLink && isRegistered && (
                        <a
                          href={event.location.virtualLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm w-full"
                        >
                          <i className="bi bi-camera-video mr-2"></i>
                          Join Virtual Event
                        </a>
                      )}
                      {event.location.virtualLink && !isRegistered && (
                        <p className="text-sm text-gray-600">
                          <i className="bi bi-info-circle mr-1"></i>
                          Virtual link available after registration
                        </p>
                      )}
                    </>
                  ) : event.location.type === 'Hybrid' ? (
                    <>
                      <p className="text-gray-700 mb-2">Hybrid Event (In-person & Virtual)</p>
                      {event.location.venue && (
                        <div className="mb-2">
                          <p className="font-semibold text-dark">{event.location.venue}</p>
                          {event.location.address && <p className="text-sm text-gray-600">{event.location.address}</p>}
                          {event.location.city && <p className="text-sm text-gray-600">{event.location.city}, {event.location.country}</p>}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      {event.location.venue && <p className="font-semibold text-dark mb-1">{event.location.venue}</p>}
                      {event.location.address && <p className="text-sm text-gray-600">{event.location.address}</p>}
                      {event.location.city && (
                        <p className="text-sm text-gray-600">
                          {event.location.city}{event.location.country ? `, ${event.location.country}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-dark mb-3">Share Event</h3>
                <div className="flex gap-2">
                  <button className="btn btn-outline-primary btn-sm flex-1" title="Share on Twitter">
                    <i className="bi bi-twitter"></i>
                  </button>
                  <button className="btn btn-outline-primary btn-sm flex-1" title="Share on Facebook">
                    <i className="bi bi-facebook"></i>
                  </button>
                  <button className="btn btn-outline-primary btn-sm flex-1" title="Share on LinkedIn">
                    <i className="bi bi-linkedin"></i>
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    title="Copy Link"
                  >
                    <i className="bi bi-link-45deg"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
