/**
 * VerificationRequest Model
 * Handles project verification requests from students/researchers to professors
 */

const mongoose = require('mongoose');

const VerificationRequestSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means any professor can approve
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  response_note: {
    type: String,
    trim: true,
    maxlength: [500, 'Response note cannot exceed 500 characters']
  },
  processed_at: {
    type: Date,
    default: null
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
VerificationRequestSchema.index({ project: 1, status: 1 });
VerificationRequestSchema.index({ requester: 1 });
VerificationRequestSchema.index({ professor: 1, status: 1 });
VerificationRequestSchema.index({ status: 1, createdAt: -1 });

// Method to check if request can be processed
VerificationRequestSchema.methods.canBeProcessed = function() {
  return this.status === 'PENDING';
};

// Method to approve request
VerificationRequestSchema.methods.approve = async function(professorId, note = '') {
  this.status = 'APPROVED';
  this.processed_at = new Date();
  this.processed_by = professorId;
  this.response_note = note;
  await this.save();
  return this;
};

// Method to reject request
VerificationRequestSchema.methods.reject = async function(professorId, note = '') {
  this.status = 'REJECTED';
  this.processed_at = new Date();
  this.processed_by = professorId;
  this.response_note = note;
  await this.save();
  return this;
};

module.exports = mongoose.model('VerificationRequest', VerificationRequestSchema);
