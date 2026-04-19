/**
 * Audit Logging Middleware
 * Logs all important actions for security monitoring
 */

const AuditLog = require('../models/AuditLog');
const { detectAnomalies, formatAlertMessage } = require('../utils/anomalyDetection');

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Get user agent from request
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Create audit log entry
 */
async function createAuditLog(data) {
  try {
    return await AuditLog.createLog(data);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Middleware to log requests
 */
function auditLogger(action, options = {}) {
  return async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    const startTime = Date.now();

    res.end = function(chunk, encoding) {
      // Restore original end function
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Log after response is sent
      const duration = Date.now() - startTime;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const logData = {
        userId: req.user?._id,
        action,
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ...(options.getDetails ? options.getDetails(req, res) : {})
        },
        ipAddress,
        userAgent,
        severity: options.severity || 'low'
      };

      // Don't await - fire and forget for performance
      createAuditLog(logData);

      // Check for anomalies if configured
      if (options.checkAnomalies && req.user) {
        detectAnomalies({
          userId: req.user._id.toString(),
          ipAddress,
          ...options.anomalyContext
        }).then(anomalies => {
          if (anomalies.length > 0) {
            // Log anomalies with high severity
            anomalies.forEach(anomaly => {
              createAuditLog({
                userId: req.user._id,
                action: anomaly.type,
                details: anomaly,
                ipAddress,
                userAgent,
                severity: anomaly.severity
              });
            });
          }
        }).catch(err => console.error('Anomaly detection error:', err));
      }
    };

    next();
  };
}

/**
 * Log authentication action
 */
async function logAuth(req, action, details = {}, severity = 'low') {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const logData = {
    action,
    details: {
      ...details,
      timestamp: new Date().toISOString()
    },
    ipAddress,
    userAgent,
    severity
  };

  if (req.user) {
    logData.userId = req.user._id;
  }

  return await createAuditLog(logData);
}

/**
 * Log vote action
 */
async function logVote(req, action, metadata = {}, details = {}) {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  return await createAuditLog({
    userId: req.user?._id,
    action,
    details: {
      ...details,
      timestamp: new Date().toISOString()
    },
    ipAddress,
    userAgent,
    severity: action === 'VOTE_FAILED' ? 'medium' : 'low',
    metadata
  });
}

/**
 * Check and log suspicious activity
 */
async function checkSuspiciousActivity(req, context = {}) {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const anomalies = await detectAnomalies({
    userId: req.user?._id?.toString(),
    ipAddress,
    identifier: context.identifier,
    position: context.position,
    department: context.department,
    ...context
  });

  if (anomalies.length > 0) {
    for (const anomaly of anomalies) {
      await createAuditLog({
        userId: req.user?._id,
        action: 'SUSPICIOUS_ACTIVITY',
        details: {
          type: anomaly.type,
          message: formatAlertMessage(anomaly),
          ...anomaly.details
        },
        ipAddress,
        userAgent,
        severity: anomaly.severity
      });
    }
  }

  return anomalies;
}

/**
 * Sanitize user data for API responses
 * Removes sensitive fields like regNumber
 */
function sanitizeUser(user) {
  if (!user) return null;

  const sanitized = {
    id: user._id?.toString() || user.id,
    email: user.email,
    department: user.department,
    departmentName: user.departmentName,
    yearOfStudy: user.yearOfStudy,
    role: user.role,
    hasVoted: user.hasVoted,
    votedPositions: user.votedPositions,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };

  return sanitized;
}

/**
 * Sanitize vote data for API responses
 */
function sanitizeVote(vote) {
  if (!vote) return null;

  return {
    id: vote._id?.toString() || vote.id,
    position: vote.position,
    department: vote.department,
    receiptHash: vote.receiptHash,
    createdAt: vote.createdAt,
    electionId: vote.electionId?.toString?.() || vote.electionId
  };
}

module.exports = {
  auditLogger,
  logAuth,
  logVote,
  createAuditLog,
  checkSuspiciousActivity,
  getClientIp,
  getUserAgent,
  sanitizeUser,
  sanitizeVote
};
