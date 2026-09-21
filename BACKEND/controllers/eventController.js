/**
 * Event Controller
 * Handles event operations
 */

const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/validator');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
exports.getEvents = asyncHandler(async (req, res, next) => {
  const { category, status, upcoming, search } = req.query;
  
  const query = {};
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by status
  if (status) {
    query.status = status;
  } else {
    // Default: only published events for non-admins
    if (req.user && req.user.role !== 'admin') {
      query.status = 'Published';
    } else if (!req.user) {
      query.status = 'Published';
      query.isPublic = true;
    }
  }
  
  // Filter upcoming events
  if (upcoming === 'true') {
    query.startDate = { $gte: new Date() };
  }
  
  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { topics: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const events = await Event.find(query)
    .populate('organizer', 'firstName lastName institution')
    .sort('startDate');

  res.status(200).json({
    status: 'success',
    count: events.length,
    data: {
      events
    }
  });
});

/**
 * @desc    Get event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
exports.getEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'firstName lastName email institution')
    .populate('registrations.user', 'firstName lastName institution');

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

/**
 * @desc    Create event
 * @route   POST /api/events
 * @access  Private (Admin/Faculty)
 */
exports.createEvent = asyncHandler(async (req, res, next) => {
  // Add organizer
  req.body.organizer = req.user.id;

  const event = await Event.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Event created successfully',
    data: {
      event
    }
  });
});

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Organizer/Admin)
 */
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check ownership
  const organizerId = (event.organizer?._id || event.organizer || '').toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (organizerId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this event', 403));
  }

  // Prevent changing organizer
  delete req.body.organizer;

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Event updated successfully',
    data: {
      event
    }
  });
});

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Organizer/Admin)
 */
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check ownership
  const organizerId = (event.organizer?._id || event.organizer || '').toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user || '').toString();
  if (organizerId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this event', 403));
  }

  await event.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully'
  });
});

/**
 * @desc    Register for event
 * @route   POST /api/events/:id/register
 * @access  Private
 */
exports.registerForEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if registration is open
  if (!event.isRegistrationOpen) {
    return next(new ErrorResponse('Registration is closed for this event', 400));
  }

  try {
    await event.registerUser(req.user.id);
    
    // Create notification
    await Notification.create({
      recipient: req.user.id,
      type: 'EVENT_REMINDER',
      title: 'Event Registration Confirmed',
      message: `You have successfully registered for "${event.title}"`,
      link: `/events/${event._id}`,
      relatedModel: 'Event',
      relatedId: event._id
    });

    await event.populate('organizer', 'firstName lastName institution');

    res.status(200).json({
      status: 'success',
      message: 'Successfully registered for event',
      data: {
        event
      }
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

/**
 * @desc    Cancel event registration
 * @route   DELETE /api/events/:id/register
 * @access  Private
 */
exports.cancelRegistration = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  await event.cancelRegistration(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Registration cancelled successfully',
    data: {
      event
    }
  });
});

/**
 * @desc    Get user's registered events
 * @route   GET /api/events/my-events/registrations
 * @access  Private
 */
exports.getMyRegistrations = asyncHandler(async (req, res, next) => {
  const events = await Event.find({
    'registrations.user': req.user.id
  })
  .populate('organizer', 'firstName lastName institution')
  .sort('startDate');

  res.status(200).json({
    status: 'success',
    count: events.length,
    data: {
      events
    }
  });
});

/**
 * @desc    Get all event registrations (Admin)
 * @route   GET /api/events/admin/registrations
 * @access  Private/Admin
 */
exports.getAllEventRegistrations = asyncHandler(async (req, res, next) => {
  const events = await Event.find({ status: { $in: ['Published', 'Completed'] } })
    .populate('organizer', 'firstName lastName email')
    .populate('registrations.user', 'firstName lastName email institution')
    .sort('-startDate');

  // Format the data for admin view
  const registrationData = events.map(event => ({
    _id: event._id,
    title: event.title,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate,
    status: event.status,
    organizer: event.organizer,
    capacity: event.capacity,
    registrationCount: event.registrationCount,
    availableSlots: event.availableSlots,
    registrations: event.registrations.map(reg => ({
      user: reg.user,
      registeredAt: reg.registeredAt,
      status: reg.status
    }))
  }));

  res.status(200).json({
    status: 'success',
    count: registrationData.length,
    data: {
      events: registrationData
    }
  });
});
