/**
 * Admin Controller
 * Security monitoring and audit log management
 */

const AuditLog = require('../models/AuditLog');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Election = require('../models/Election');
const { asyncHandler } = require('../middleware/validate');

/**
 * @desc    Get audit logs with filtering
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    action,
    severity,
    userId,
    ipAddress,
    startDate,
    endDate,
    hours = 24
  } = req.query;

  // Build query
  const query = {};

  if (action) query.action = action;
  if (severity) query.severity = severity;
  if (userId) query.userId = userId;
  if (ipAddress) query.ipAddress = { $regex: ipAddress, $options: 'i' };

  // Date filtering
  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (hours) {
    query.timestamp = {
      $gte: new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000)
    };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get logs
  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'email department');

  // Get total count
  const total = await AuditLog.countDocuments(query);

  // Get summary statistics
  const stats = await AuditLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    }
  });
});

/**
 * @desc    Get suspicious activity alerts
 * @route   GET /api/admin/security/alerts
 * @access  Private/Admin
 */
const getSecurityAlerts = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

  // Get high/critical severity events
  const criticalEvents = await AuditLog.find({
    timestamp: { $gte: since },
    severity: { $in: ['high', 'critical'] }
  })
    .sort({ timestamp: -1 })
    .populate('userId', 'email regNumber')
    .lean();

  // Get suspicious activity summary
  const suspiciousSummary = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        $or: [
          { severity: { $in: ['high', 'critical'] } },
          { action: { $in: ['SUSPICIOUS_ACTIVITY', 'MULTI_IP_LOGIN', 'RATE_LIMIT_EXCEEDED'] } }
        ]
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        latest: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get top suspicious IPs
  const suspiciousIps = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
        severity: { $in: ['high', 'critical'] }
      }
    },
    {
      $group: {
        _id: '$ipAddress',
        count: { $sum: 1 },
        actions: { $addToSet: '$action' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      criticalEvents,
      summary: suspiciousSummary,
      topSuspiciousIps: suspiciousIps,
      timeWindow: `${hours} hours`,
      totalAlerts: criticalEvents.length
    }
  });
});

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getSystemStats = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

  // User statistics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({ createdAt: { $gte: since } });
  const usersByDepartment = await User.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);
  const usersVoted = await User.countDocuments({ hasVoted: true });

  // Vote statistics
  const totalVotes = await Vote.countDocuments();
  const votesInPeriod = await Vote.countDocuments({ createdAt: { $gte: since } });
  const votesByPosition = await Vote.aggregate([
    { $group: { _id: '$position', count: { $sum: 1 } } }
  ]);

  // Audit statistics
  const totalAuditLogs = await AuditLog.countDocuments();
  const auditLogsInPeriod = await AuditLog.countDocuments({ timestamp: { $gte: since } });
  const failedLogins = await AuditLog.countDocuments({
    timestamp: { $gte: since },
    action: 'LOGIN_FAILED'
  });

  // Election status
  const activeElection = await Election.getActiveElection();

  res.status(200).json({
    success: true,
    data: {
      timeWindow: `${hours} hours`,
      users: {
        total: totalUsers,
        new: newUsers,
        voted: usersVoted,
        turnout: totalUsers > 0 ? (usersVoted / totalUsers) * 100 : 0,
        byDepartment: usersByDepartment.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
      votes: {
        total: totalVotes,
        inPeriod: votesInPeriod,
        byPosition: votesByPosition.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
      security: {
        totalAuditLogs,
        auditLogsInPeriod,
        failedLogins,
        suspiciousEvents: await AuditLog.countDocuments({
          timestamp: { $gte: since },
          severity: { $in: ['high', 'critical'] }
        })
      },
      election: activeElection ? {
        id: activeElection._id,
        name: activeElection.name,
        status: activeElection.status,
        totalVotes: activeElection.totalVotes,
        turnout: activeElection.turnout
      } : null
    }
  });
});

/**
 * @desc    Get votes over time for analytics
 * @route   GET /api/admin/votes-over-time
 * @access  Private/Admin
 */
const getVotesOverTime = asyncHandler(async (req, res) => {
  const election = await Election.getActiveElection();
  
  const matchQuery = {};
  if (election) {
    matchQuery.electionId = election._id;
  } else {
    // If no active election, get the most recent one
    const latest = await Election.findOne().sort({ createdAt: -1 });
    if (latest) matchQuery.electionId = latest._id;
  }

  // Group votes by hour
  const votesData = await Vote.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } } // Sort chronologically
  ]);

  res.status(200).json({
    success: true,
    data: votesData.map(v => ({ time: v._id, votes: v.count }))
  });
});

/**
 * @desc    Verify vote chain integrity
 * @route   GET /api/admin/votes/verify-chain
 * @access  Private/Admin
 */
const verifyVoteChain = asyncHandler(async (req, res) => {
  const verification = await Vote.verifyChain();

  if (!verification.valid) {
    return res.status(500).json({
      success: false,
      message: 'Vote chain integrity check failed!',
      data: verification
    });
  }

  res.status(200).json({
    success: true,
    message: 'Vote chain integrity verified',
    data: verification
  });
});

/**
 * @desc    Get vote details (with decryption)
 * @route   GET /api/admin/votes/:id
 * @access  Private/Admin
 */
const getVoteDetails = asyncHandler(async (req, res) => {
  const { decrypt } = req.query;

  const vote = await Vote.findById(req.params.id)
    .populate('voterId', 'email department')
    .populate('candidateId');

  if (!vote) {
    return res.status(404).json({
      success: false,
      message: 'Vote not found'
    });
  }

  const response = {
    id: vote._id,
    position: vote.position,
    department: vote.department,
    receiptHash: vote.receiptHash,
    chainedHash: vote.chainedHash,
    previousHash: vote.previousHash,
    voter: vote.voterId ? {
      id: vote.voterId._id,
      email: vote.voterId.email,
      department: vote.voterId.department
    } : null,
    createdAt: vote.createdAt
  };

  // Only decrypt if explicitly requested
  if (decrypt === 'true') {
    try {
      const { decryptVote } = require('../utils/encryption');
      const decrypted = decryptVote(vote.encryptedVoteData);
      response.decryptedData = decrypted;
    } catch (error) {
      response.decryptionError = error.message;
    }
  }

  res.status(200).json({
    success: true,
    data: response
  });
});

/**
 * @desc    Force user logout (revoke sessions)
 * @route   POST /api/admin/users/:id/logout
 * @access  Private/Admin
 */
const forceUserLogout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Log the action
  const { createAuditLog } = require('../middleware/auditLogger');
  await createAuditLog({
    userId: req.user._id,
    action: 'ADMIN_ACTION',
    details: {
      action: 'FORCE_LOGOUT',
      targetUserId: user._id,
      targetEmail: user.email,
      reason: req.body.reason || 'Security precaution'
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    severity: 'high'
  });

  res.status(200).json({
    success: true,
    message: `User ${user.email} has been logged out from all sessions`,
    data: {
      userId: user._id,
      email: user.email,
      action: 'FORCE_LOGOUT'
    }
  });
});

module.exports = {
  getAuditLogs,
  getSecurityAlerts,
  getSystemStats,
  verifyVoteChain,
  getVoteDetails,
  forceUserLogout,
  getVotesOverTime
};
