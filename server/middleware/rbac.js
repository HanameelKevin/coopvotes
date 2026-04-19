/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces authorization based on user roles
 */

const roles = {
  student: ['vote', 'view_election', 'view_results', 'view_candidates'],
  aspirant: ['vote', 'view_election', 'view_results', 'view_candidates', 'view_own_application'],
  admin: ['vote', 'view_election', 'view_results', 'view_candidates', 'manage_election', 'manage_candidates', 'view_audit_logs', 'export_results', 'manage_users']
};

/**
 * Check if user has required permission
 */
function hasPermission(userRole, requiredPermission) {
  const userPermissions = roles[userRole] || [];
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has one of the allowed roles
 */
function hasRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

/**
 * Middleware to check permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
    }

    next();
  };
}

/**
 * Middleware to check role
 * Alternative to authorize in auth.js
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasRole(req.user.role, allowedRoles)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to ensure user can only access their own data
 * Admins can access any user's data
 */
function requireOwnership(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    const requestedUserId = req.params[paramName];
    if (requestedUserId && requestedUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own data'
      });
    }

    next();
  };
}

/**
 * Middleware to check if election is active before allowing votes
 */
function requireActiveElection() {
  return async (req, res, next) => {
    const Election = require('../models/Election');
    const election = await Election.getActiveElection();

    if (!election) {
      return res.status(400).json({
        success: false,
        message: 'No active election'
      });
    }

    const now = new Date();
    if (election.startTime && election.startTime > now) {
      return res.status(400).json({
        success: false,
        message: 'Election has not started yet'
      });
    }

    if (election.endTime && election.endTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Election has ended'
      });
    }

    req.election = election;
    next();
  };
}

module.exports = {
  roles,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  requireOwnership,
  requireActiveElection
};
