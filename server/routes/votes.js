const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  castVote,
  verifyVote,
  getVoteStatus,
  getResults,
  verifyVoteChain,
  exportResults,
  exportResultsPDF
} = require('../controllers/voteController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { voteLimiter, verifyLimiter } = require('../middleware/rateLimiter');

// Public route - verify vote by receipt (rate limited)
router.get('/verify', verifyLimiter, verifyVote);

// Protected routes - all require authentication
router.use(protect);

// Results route - requires user to have voted OR be admin
router.get('/results', (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!req.user.hasVoted) {
    return res.status(403).json({
      success: false,
      message: 'You must cast your vote before viewing results'
    });
  }
  next();
}, getResults);

// Get vote status - protected
router.get('/status', getVoteStatus);

// Verify vote chain integrity - admin only
router.get('/verify-chain', authorize('admin'), verifyVoteChain);

// Export results as CSV - admin only
router.get('/results/export', authorize('admin'), exportResults);

// Export results as PDF - admin only
router.get('/results/export/pdf', authorize('admin'), exportResultsPDF);

// Vote casting - students only with strict rate limiting
router.post('/', voteLimiter, [
  body('candidateId').notEmpty().withMessage('Candidate ID is required').isMongoId(),
  body('position')
    .notEmpty().withMessage('Position is required')
    .isIn(['President', 'Congress Person', 'Male Delegate', 'Female Delegate']),
  body('department').custom((value, { req }) => {
    if (req.body.position === 'President' && value !== null) {
      throw new Error('Department must be null for President position');
    }
    if (req.body.position !== 'President' && !value) {
      throw new Error('Department is required for this position');
    }
    return true;
  }),
  validate
], authorize('student'), castVote);

module.exports = router;
