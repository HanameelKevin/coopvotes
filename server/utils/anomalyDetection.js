/**
 * Anomaly Detection Service
 * Detects suspicious voting behavior and security threats
 */

const AuditLog = require('../models/AuditLog');

// Thresholds for anomaly detection
const THRESHOLDS = {
  // Multiple IP logins: different IPs within time window
  MULTI_IP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  MULTI_IP_THRESHOLD: 2, // Alert if 2+ different IPs

  // Rapid requests: requests per minute
  RAPID_REQUESTS_WINDOW_MS: 60 * 1000, // 1 minute
  RAPID_REQUESTS_THRESHOLD: 30, // Alert if 30+ requests per minute

  // Vote spikes: votes per position per minute
  VOTE_SPIKE_WINDOW_MS: 60 * 1000, // 1 minute
  VOTE_SPIKE_THRESHOLD: 20, // Alert if 20+ votes for same position in 1 minute

  // Failed login attempts
  FAILED_LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  FAILED_LOGIN_THRESHOLD: 5, // Alert if 5+ failed attempts

  // Multiple votes from same IP
  MULTI_VOTE_IP_THRESHOLD: 5 // Alert if 5+ different users voting from same IP
};

/**
 * Detect multiple IP logins for same user
 * @param {string} userId - User ID
 * @param {string} currentIp - Current IP address
 */
async function detectMultiIpLogin(userId, currentIp) {
  const since = new Date(Date.now() - THRESHOLDS.MULTI_IP_WINDOW_MS);

  const logins = await AuditLog.find({
    userId,
    action: 'LOGIN',
    timestamp: { $gte: since }
  }).distinct('ipAddress');

  const uniqueIps = new Set([...logins, currentIp]);

  if (uniqueIps.size >= THRESHOLDS.MULTI_IP_THRESHOLD) {
    return {
      isAnomaly: true,
      type: 'MULTI_IP_LOGIN',
      severity: 'high',
      details: {
        uniqueIpCount: uniqueIps.size,
        ips: Array.from(uniqueIps),
        timeWindow: '1 hour'
      }
    };
  }

  return { isAnomaly: false };
}

/**
 * Detect rapid requests from same IP
 * @param {string} ipAddress - IP address
 * @param {string} userId - User ID (optional)
 */
async function detectRapidRequests(ipAddress, userId = null) {
  const since = new Date(Date.now() - THRESHOLDS.RAPID_REQUESTS_WINDOW_MS);

  const query = {
    ipAddress,
    timestamp: { $gte: since }
  };

  if (userId) {
    query.userId = userId;
  }

  const requestCount = await AuditLog.countDocuments(query);

  if (requestCount >= THRESHOLDS.RAPID_REQUESTS_THRESHOLD) {
    return {
      isAnomaly: true,
      type: 'RAPID_REQUESTS',
      severity: 'medium',
      details: {
        requestCount,
        threshold: THRESHOLDS.RAPID_REQUESTS_THRESHOLD,
        timeWindow: '1 minute'
      }
    };
  }

  return { isAnomaly: false };
}

/**
 * Detect vote spikes for a position
 * @param {string} position - Position name
 * @param {string} department - Department (optional)
 */
async function detectVoteSpike(position, department = null) {
  const since = new Date(Date.now() - THRESHOLDS.VOTE_SPIKE_WINDOW_MS);

  const query = {
    action: 'VOTE_CAST',
    'metadata.position': position,
    timestamp: { $gte: since }
  };

  if (department) {
    query['metadata.department'] = department;
  }

  const voteCount = await AuditLog.countDocuments(query);

  if (voteCount >= THRESHOLDS.VOTE_SPIKE_THRESHOLD) {
    return {
      isAnomaly: true,
      type: 'VOTE_SPIKE',
      severity: 'high',
      details: {
        voteCount,
        threshold: THRESHOLDS.VOTE_SPIKE_THRESHOLD,
        position,
        department,
        timeWindow: '1 minute'
      }
    };
  }

  return { isAnomaly: false };
}

/**
 * Detect multiple failed login attempts
 * @param {string} ipAddress - IP address
 * @param {string} identifier - Email or reg number
 */
async function detectBruteForce(ipAddress, identifier) {
  const since = new Date(Date.now() - THRESHOLDS.FAILED_LOGIN_WINDOW_MS);

  const failedAttempts = await AuditLog.countDocuments({
    $or: [
      { ipAddress, action: 'LOGIN_FAILED' },
      { 'details.identifier': identifier, action: 'LOGIN_FAILED' }
    ],
    timestamp: { $gte: since }
  });

  if (failedAttempts >= THRESHOLDS.FAILED_LOGIN_THRESHOLD) {
    return {
      isAnomaly: true,
      type: 'BRUTE_FORCE_ATTEMPT',
      severity: 'critical',
      details: {
        failedAttempts,
        threshold: THRESHOLDS.FAILED_LOGIN_THRESHOLD,
        ipAddress,
        identifier: identifier ? '***masked***' : 'unknown',
        timeWindow: '15 minutes'
      }
    };
  }

  return { isAnomaly: false };
}

/**
 * Detect multiple votes from same IP (different users)
 * @param {string} ipAddress - IP address
 */
async function detectMultiVoteFromIp(ipAddress) {
  const since = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

  const uniqueVoters = await AuditLog.distinct('userId', {
    ipAddress,
    action: 'VOTE_CAST',
    timestamp: { $gte: since }
  });

  if (uniqueVoters.length >= THRESHOLDS.MULTI_VOTE_IP_THRESHOLD) {
    return {
      isAnomaly: true,
      type: 'MULTI_VOTE_IP',
      severity: 'high',
      details: {
        uniqueVoterCount: uniqueVoters.length,
        threshold: THRESHOLDS.MULTI_VOTE_IP_THRESHOLD,
        ipAddress: ipAddress.replace(/\.\d+$/, '.xxx'), // Mask last octet
        timeWindow: '1 hour'
      }
    };
  }

  return { isAnomaly: false };
}

/**
 * Run all anomaly detection checks
 * @param {Object} context - Context data for detection
 */
async function detectAnomalies(context) {
  const anomalies = [];

  const checks = [
    context.userId && context.ipAddress ? detectMultiIpLogin(context.userId, context.ipAddress) : null,
    context.ipAddress ? detectRapidRequests(context.ipAddress, context.userId) : null,
    context.position ? detectVoteSpike(context.position, context.department) : null,
    context.ipAddress && context.identifier ? detectBruteForce(context.ipAddress, context.identifier) : null,
    context.ipAddress ? detectMultiVoteFromIp(context.ipAddress) : null
  ].filter(Boolean);

  const results = await Promise.all(checks);

  results.forEach(result => {
    if (result.isAnomaly) {
      anomalies.push(result);
    }
  });

  return anomalies;
}

/**
 * Get admin alert message for anomaly
 * @param {Object} anomaly - Anomaly detection result
 */
function formatAlertMessage(anomaly) {
  const templates = {
    MULTI_IP_LOGIN: `SECURITY ALERT: User logged in from ${anomaly.details.uniqueIpCount} different IPs within ${anomaly.details.timeWindow}`,
    RAPID_REQUESTS: `SECURITY ALERT: ${anomaly.details.requestCount} requests detected from same source within ${anomaly.details.timeWindow}`,
    VOTE_SPIKE: `SECURITY ALERT: Vote spike detected for ${anomaly.details.position} - ${anomaly.details.voteCount} votes in ${anomaly.details.timeWindow}`,
    BRUTE_FORCE_ATTEMPT: `CRITICAL SECURITY ALERT: ${anomaly.details.failedAttempts} failed login attempts detected`,
    MULTI_VOTE_IP: `SECURITY ALERT: ${anomaly.details.uniqueVoterCount} different users voting from same IP within ${anomaly.details.timeWindow}`
  };

  return templates[anomaly.type] || `SECURITY ALERT: ${anomaly.type} detected`;
}

module.exports = {
  detectAnomalies,
  detectMultiIpLogin,
  detectRapidRequests,
  detectVoteSpike,
  detectBruteForce,
  detectMultiVoteFromIp,
  formatAlertMessage,
  THRESHOLDS
};
