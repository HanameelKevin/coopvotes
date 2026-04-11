const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  castVote,
  getVoteStatus,
  getResults,
  exportResults
} = require('../controllers/voteController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes (must come before protected routes)
router.get('/results', getResults);

// Protected routes (use middleware for all subsequent routes)
router.use(protect);

// Vote casting - students only
router.post('/', [
  body('candidateId').notEmpty().withMessage('Candidate ID is required').isMongoId(),
  body('position')
    .notEmpty().withMessage('Position is required')
    .isIn(['President', 'Congress Person', 'Male Delegate', 'Female Delegate']),
  body('department').custom((value, { req }) => {
    // If position is President, department should be null
    if (req.body.position === 'President' && value !== null) {
      throw new Error('Department must be null for President position');
    }
    // If position is not President, department should be a string
    if (req.body.position !== 'President' && !value) {
      throw new Error('Department is required for this position');
    }
    return true;
  }),
  validate
], authorize('student'), castVote);

// Get vote status - protected
router.get('/status', getVoteStatus);

// Export results - admin only
router.get('/results/export', authorize('admin'), exportResults);

module.exports = router;
