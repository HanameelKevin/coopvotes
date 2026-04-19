const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const {
  getAuditLogs,
  getSecurityAlerts,
  getSystemStats,
  verifyVoteChain,
  getVoteDetails,
  forceUserLogout,
  getVotesOverTime
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Apply rate limiting to admin routes
router.use(generalLimiter);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filtering
 * @access  Admin
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/admin/security/alerts
 * @desc    Get security alerts and suspicious activity
 * @access  Admin
 */
router.get('/security/alerts', getSecurityAlerts);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin
 */
router.get('/stats', getSystemStats);

/**
 * @route   GET /api/admin/votes-over-time
 * @desc    Get votes timeline for analytics
 * @access  Admin
 */
router.get('/votes-over-time', getVotesOverTime);

/**
 * @route   GET /api/admin/votes/verify-chain
 * @desc    Verify vote chain integrity
 * @access  Admin
 */
router.get('/votes/verify-chain', verifyVoteChain);

/**
 * @route   GET /api/admin/votes/:id
 * @desc    Get vote details (optionally decrypted)
 * @access  Admin
 */
router.get('/votes/:id', getVoteDetails);

/**
 * @route   POST /api/admin/users/:id/logout
 * @desc    Force user logout
 * @access  Admin
 */
router.post('/users/:id/logout', forceUserLogout);

module.exports = router;
