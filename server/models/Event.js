/**
 * Event Model
 * Handles university events, seminars, conferences, workshops
 */

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'Seminar',
      'Workshop',
      'Conference',
      'Symposium',
      'Webinar',
      'Training',
      'Competition',
      'Exhibition',
      'Other'
    ],
    required: [true, 'Event category is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  speakers: [{
    name: {
      type: String,
      required: true
    },
    title: String,
    organization: String,
    bio: String
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Physical', 'Virtual', 'Hybrid'],
      required: true
    },
    venue: String,
    address: String,
    city: String,
    country: String,
    virtualLink: String
  },
  capacity: {
    type: Number,
    min: 1
  },
  registrationDeadline: {
    type: Date
  },
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Waitlist', 'Cancelled'],
      default: 'Confirmed'
    }
  }],
  topics: [String],
  targetAudience: [String],
  prerequisites: String,
  registrationFee: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  materials: [{
    name: String,
    url: String,
    type: String
  }],
  images: [String],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Cancelled', 'Completed'],
    default: 'Draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
EventSchema.index({ startDate: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ organizer: 1 });

// Virtual for number of registrations
EventSchema.virtual('registrationCount').get(function() {
  return this.registrations.filter(r => r.status === 'Confirmed').length;
});

// Virtual for available slots
EventSchema.virtual('availableSlots').get(function() {
  if (!this.capacity) return null;
  return this.capacity - this.registrationCount;
});

// Virtual to check if registration is open
EventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  if (this.registrationDeadline && now > this.registrationDeadline) return false;
  if (this.capacity && this.registrationCount >= this.capacity) return false;
  if (this.status !== 'Published') return false;
  return true;
});

// Method to register user
EventSchema.methods.registerUser = async function(userId) {
  // Check if already registered
  const existingRegistration = this.registrations.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingRegistration) {
    throw new Error('User already registered for this event');
  }

  // Check capacity
  let status = 'Confirmed';
  if (this.capacity && this.registrationCount >= this.capacity) {
    status = 'Waitlist';
  }

  this.registrations.push({
    user: userId,
    status
  });

  await this.save();
  return this;
};

// Method to cancel registration
EventSchema.methods.cancelRegistration = async function(userId) {
  this.registrations = this.registrations.filter(
    r => r.user.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

// Method to check if user is registered
EventSchema.methods.isUserRegistered = function(userId) {
  return this.registrations.some(
    r => r.user.toString() === userId.toString()
  );
};

module.exports = mongoose.model('Event', EventSchema);
