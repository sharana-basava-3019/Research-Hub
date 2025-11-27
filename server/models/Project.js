const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  
  title: {
    type: String,
    required: [true, 'Please provide project title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide project description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  abstract: {
    type: String,
    maxlength: [1000, 'Abstract cannot exceed 1000 characters']
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Flexible collaborator roles - can be any project role such as:
  // Technical: Frontend Developer, Backend Developer, Full Stack Developer, DevOps Engineer, Data Scientist, Data Analyst, ML Engineer
  // Design: UI/UX Designer, Graphic Designer, Product Designer
  // Research: Lead Researcher, Co-Investigator, Research Assistant, Data Collector
  // Management: Project Manager, Product Owner, Scrum Master
  // Content: Technical Writer, Content Strategist, Documentation Specialist
  // Other: QA Engineer, Security Analyst, Domain Expert, Advisor, Contributor
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      trim: true,
      default: 'Collaborator'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  researchArea: {
    type: String,
    required: [true, 'Please specify research area'],
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  methodology: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Planning'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  

  fundingSource: {
    type: String,
    trim: true
  },
  fundingAmount: {
    type: Number,
    min: 0
  },
  
 
  visibility: {
    type: String,
    enum: ['Public', 'Private', 'Restricted'],
    default: 'Public'
  },
  
  
  isOpenForCollaboration: {
    type: Boolean,
    default: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  maxCollaborators: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },

  
  repository: {
    type: String,
    trim: true
  },
  documentation: {
    type: String,
    trim: true
  },
  publications: [{
    title: String,
    url: String,
    publishedDate: Date
  }],

  attachments: [{
    filename: String,
    url: String,
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },

  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


ProjectSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

ProjectSchema.virtual('collaborationRequests', {
  ref: 'Collaboration',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

ProjectSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

ProjectSchema.methods.isCollaborator = function(userId) {
  return this.collaborators.some(
    collab => collab.user.toString() === userId.toString()
  );
};

ProjectSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
};

ProjectSchema.index({ title: 'text', description: 'text', keywords: 'text' });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ researchArea: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ keywords: 1 });
ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
