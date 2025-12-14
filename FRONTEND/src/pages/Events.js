import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, title, capacity

  const categories = [
    'all',
    'Workshop',
    'Conference',
    'Competition'
  ];

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchMyRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, category]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter === 'upcoming') {
        params.upcoming = true;
      }
      
      if (category !== 'all') {
        params.category = category;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await api.get('/events', { params });
      setEvents(res.data.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await api.get('/events/my-events/registrations');
      setMyRegistrations(res.data.data.events.map(e => e._id) || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const registerForEvent = async (eventId) => {
    if (!user) {
      toast.info('Please login to register for events');
      navigate('/login');
      return;
    }

    // Find the event to check capacity
    const event = events.find(e => e._id === eventId);
    if (event && event.capacity && event.registrationCount >= event.capacity) {
      toast.warning('Sorry, this event is already full');
      return;
    }

    try {
      await api.post(`/events/${eventId}/register`);
      toast.success('Successfully registered for event!');
      fetchEvents();
      fetchMyRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  const cancelRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;

    try {
      await api.delete(`/events/${eventId}/register`);
      toast.success('Registration cancelled');
      fetchEvents();
      fetchMyRegistrations();
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const isRegistered = (eventId) => {
    return myRegistrations.includes(eventId);
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

  const getLocationIcon = (type) => {
    return type === 'Virtual' ? 'bi-camera-video' : type === 'Hybrid' ? 'bi-hybrid' : 'bi-geo-alt';
  };

  return (
    <div className="bg-light min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-dark mb-2">Events</h1>
              <p className="text-gray-600">
                Discover and register for seminars, workshops, and conferences
              </p>
            </div>
            {user && (user.role === 'admin' || user.role === 'faculty') && (
              <Link to="/events/create" className="btn btn-primary">
                <i className="bi bi-plus-circle mr-2"></i>
                Create Event
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="card-body">
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control flex-1"
                  placeholder="Search events by title, topic..."
                />
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-search mr-2"></i>
                  Search
                </button>
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${
                  filter === 'all' ? 'btn-primary' : 'btn-outline-primary'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`btn btn-sm ${
                  filter === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'
                }`}
              >
                Upcoming
              </button>
              {user && (
                <button
                  onClick={() => setFilter('my-events')}
                  className={`btn btn-sm ${
                    filter === 'my-events' ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                >
                  My Events
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`badge ${
                    category === cat
                      ? `badge-${cat === 'all' ? 'primary' : getCategoryColor(cat)}`
                      : 'badge-secondary'
                  } cursor-pointer hover:opacity-80`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted mb-0">
                <i className="bi bi-sort-down me-1"></i>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
              >
                <option value="date">Date (Earliest First)</option>
                <option value="date-desc">Date (Latest First)</option>
                <option value="title">Title (A-Z)</option>
                <option value="capacity">Available Spots</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sort and filter events */}
        {(() => {
          let sortedEvents = [...events];
          
          switch (sortBy) {
            case 'date':
              sortedEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
              break;
            case 'date-desc':
              sortedEvents.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
              break;
            case 'title':
              sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
              break;
            case 'capacity':
              sortedEvents.sort((a, b) => {
                const aAvailable = (a.capacity || 0) - (a.registrationCount || 0);
                const bAvailable = (b.capacity || 0) - (b.registrationCount || 0);
                return bAvailable - aAvailable;
              });
              break;
            default:
              break;
          }
          
          const eventsToDisplay = sortedEvents;
          
          return (
            <>
              {/* Events Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="spinner mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading events...</p>
                </div>
              ) : eventsToDisplay.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsToDisplay.map((event) => (
              <div key={event._id} className="card hover-lift">
                {/* Event Image/Banner */}
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center">
                    <i className={`bi ${getLocationIcon(event.location?.type)} text-6xl text-white opacity-20`}></i>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`badge badge-${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  {isRegistered(event._id) && (
                    <div className="absolute top-4 left-4">
                      <span className="badge badge-success">
                        <i className="bi bi-check-circle mr-1"></i>
                        Registered
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {/* Date Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary-100 rounded flex flex-col items-center justify-center">
                      <span className="text-xs text-primary font-semibold">
                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {new Date(event.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark line-clamp-2">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="bi bi-clock mr-2 text-primary"></i>
                      {formatTime(event.startDate)} - {formatTime(event.endDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <i className={`${getLocationIcon(event.location?.type)} mr-2 text-primary`}></i>
                      {event.location?.venue || event.location?.type}
                    </div>
                    {event.organizer && (
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="bi bi-person mr-2 text-primary"></i>
                        {event.organizer.firstName} {event.organizer.lastName}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="bi bi-people mr-2 text-primary"></i>
                        {event.registrationCount || 0} / {event.capacity} registered
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/events/${event._id}`}
                      className="btn btn-outline-primary btn-sm flex-1"
                    >
                      View Details
                    </Link>
                    {user && (
                      isRegistered(event._id) ? (
                        <button
                          onClick={() => cancelRegistration(event._id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Cancel Registration"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => registerForEvent(event._id)}
                          className="btn btn-primary btn-sm"
                          disabled={event.capacity && event.registrationCount >= event.capacity}
                        >
                          <i className="bi bi-calendar-check mr-1"></i>
                          Register
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <i className="bi bi-calendar-x text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No events found
              </h3>
              <p className="text-gray-500">
                {filter === 'upcoming'
                  ? 'No upcoming events at the moment'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          </div>
        )}
      </>
    );
  })()}
      </div>
    </div>
  );
};

export default Events;
