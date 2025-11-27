/**
 * Comment Model
 * Represents comments/discussions on research projects
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  // Comment Content
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },

  // Author & Target
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Threading Support
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },

  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  justOne: false
});

// Method to like/unlike comment
CommentSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex > -1) {
    // Unlike
    this.likes.splice(likeIndex, 1);
  } else {
    // Like
    this.likes.push(userId);
  }
  
  await this.save();
  return this;
};

// Method to edit comment
CommentSchema.methods.editComment = async function(newText) {
  this.text = newText;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
  return this;
};

// Method to soft delete comment
CommentSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.text = '[This comment has been deleted]';
  await this.save();
  return this;
};

// Indexes
CommentSchema.index({ project: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
