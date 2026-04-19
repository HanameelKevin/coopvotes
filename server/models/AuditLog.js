const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGIN_FAILED',
      'LOGOUT',
      'VOTE_CAST',
      'VOTE_FAILED',
      'VOTE_VERIFIED',
      'ELECTION_VIEW',
      'RESULTS_VIEW',
      'ADMIN_ACTION',
      'SUSPICIOUS_ACTIVITY',
      'MULTI_IP_LOGIN',
      'RAPID_REQUESTS',
      'RATE_LIMIT_EXCEEDED'
    ],
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  metadata: {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election'
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    position: String,
    department: String
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(data) {
  return await this.create({
    userId: data.userId,
    action: data.action,
    details: data.details || {},
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    severity: data.severity || 'low',
    metadata: data.metadata || {}
  });
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get suspicious activity
auditLogSchema.statics.getSuspiciousActivity = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await this.find({
    timestamp: { $gte: since },
    $or: [
      { severity: { $in: ['high', 'critical'] } },
      { action: 'SUSPICIOUS_ACTIVITY' },
      { action: 'MULTI_IP_LOGIN' },
      { action: 'RAPID_REQUESTS' }
    ]
  })
    .sort({ timestamp: -1 })
    .populate('userId', 'email regNumber')
    .lean();
};

// Static method to get login attempts by IP
auditLogSchema.statics.getLoginsByIp = async function(ipAddress, hours = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await this.find({
    ipAddress,
    timestamp: { $gte: since },
    action: { $in: ['LOGIN', 'LOGIN_FAILED'] }
  }).lean();
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
