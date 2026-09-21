
const mongoose = require('mongoose');

const CollaborationSchema = new mongoose.Schema({
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },

  message: {
    type: String,
    required: [true, 'Please provide a message'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  // Flexible role assignment - accepts any project role such as:
  // Frontend Developer, Backend Developer, Data Analyst, Data Scientist, UI/UX Designer,
  // Project Manager, Research Assistant, Technical Writer, QA Engineer, etc.
  proposedRole: {
    type: String,
    default: 'Collaborator',
    trim: true
  },
  collaborationType: {
    type: String,
    enum: ['invite', 'request'],
    default: 'request',
    description: 'invite: owner inviting someone to join; request: non-owner requesting to join'
  },

  
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Revoked', 'Exited'],
    default: 'Pending'
  },
  

  response: {
    message: {
      type: String,
      maxlength: [500, 'Response message cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date
    }
  },

  expiresAt: {
    type: Date,
    default: function() {
      
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});


CollaborationSchema.index({ sender: 1, receiver: 1, project: 1, status: 1 }, { unique: true });


CollaborationSchema.methods.accept = async function(responseMessage = '') {
  this.status = 'Accepted';
  this.response = {
    message: responseMessage,
    respondedAt: new Date()
  };
  await this.save();
  
  const Project = mongoose.model('Project');
  const projectId = this.project?._id || this.project?.id || this.project;
  
  if (projectId) {
    const rawUser = this.collaborationType === 'invite' ? this.receiver : this.sender;
    const userToAdd = rawUser?._id || rawUser?.id || rawUser;
    
    if (userToAdd) {
      await Project.updateOne(
        { _id: projectId, 'collaborators.user': { $ne: userToAdd } },
        {
          $push: {
            collaborators: {
              user: userToAdd,
              role: this.proposedRole || 'Collaborator',
              joinedAt: new Date()
            }
          }
        }
      );
    }
  }
  
  return this;
};

CollaborationSchema.methods.reject = async function(responseMessage = '') {
  this.status = 'Rejected';
  this.response = {
    message: responseMessage,
    respondedAt: new Date()
  };
  await this.save();
  return this;
};

CollaborationSchema.methods.cancel = async function() {
  this.status = 'Cancelled';
  await this.save();
  return this;
};

CollaborationSchema.methods.revoke = async function(reason = '', revokedBy = null) {
  this.status = 'Revoked';
  this.response = {
    message: reason,
    respondedAt: new Date()
  };
  await this.save();

  const Project = mongoose.model('Project');
  const projectId = this.project?._id || this.project?.id || this.project;
  if (projectId) {
    const rawUser = this.collaborationType === 'invite' ? this.receiver : this.sender;
    const targetUserId = rawUser?._id || rawUser?.id || rawUser;
    if (targetUserId) {
      await Project.updateOne(
        { _id: projectId },
        {
          $pull: {
            collaborators: {
              user: targetUserId
            }
          }
        }
      );
    }
  }

  return this;
};

CollaborationSchema.methods.exit = async function(reason = '', exitedBy = null) {
  this.status = 'Exited';
  this.response = {
    message: reason,
    respondedAt: new Date()
  };
  await this.save();

  const Project = mongoose.model('Project');
  const projectId = this.project?._id || this.project?.id || this.project;
  if (projectId) {
    const rawUser = this.collaborationType === 'invite' ? this.receiver : this.sender;
    const targetUserId = rawUser?._id || rawUser?.id || rawUser;
    if (targetUserId) {
      await Project.updateOne(
        { _id: projectId },
        {
          $pull: {
            collaborators: {
              user: targetUserId
            }
          }
        }
      );
    }
  }

  return this;
};

CollaborationSchema.statics.requestExists = async function(senderId, receiverId, projectId) {
  if (!senderId || !receiverId || !projectId) return false;
  const existingRequest = await this.findOne({
    sender: senderId,
    receiver: receiverId,
    project: projectId,
    status: { $in: ['Pending', 'Accepted'] }
  });
  return !!existingRequest;
};

CollaborationSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { status: 'Pending' }
});

module.exports = mongoose.model('Collaboration', CollaborationSchema);
