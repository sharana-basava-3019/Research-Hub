const mongoose = require('mongoose');

const AnalyticsDataSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ['recommendations', 'trends', 'keywords', 'clustering', 'metrics'],
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  generatedBy: {
    type: String,
    enum: ['python-service', 'node-service', 'manual'],
    default: 'python-service'
  },
  
  expiresAt: {
    type: Date,
    default: function() {

      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },

  processingTime: {
    type: Number, 
    default: 0
  },
  version: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

AnalyticsDataSchema.index({ type: 1, userId: 1 });
AnalyticsDataSchema.index({ type: 1, projectId: 1 });
AnalyticsDataSchema.index({ createdAt: -1 });
AnalyticsDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

AnalyticsDataSchema.statics.getCached = async function(type, userId, projectId) {
  const query = { type };
  if (userId) query.userId = userId;
  if (projectId) query.projectId = projectId;
  
  const cached = await this.findOne(query)
    .where('expiresAt').gt(new Date())
    .sort({ createdAt: -1 });
  
  return cached;
};

AnalyticsDataSchema.statics.cacheData = async function(type, data, options = {}) {
  const { userId, projectId, generatedBy, processingTime } = options;

  const query = { type };
  if (userId) query.userId = userId;
  if (projectId) query.projectId = projectId;
  await this.deleteMany(query);
  
  const cached = await this.create({
    type,
    data,
    userId,
    projectId,
    generatedBy,
    processingTime
  });
  
  return cached;
};

module.exports = mongoose.model('AnalyticsData', AnalyticsDataSchema);