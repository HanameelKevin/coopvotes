const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  updateOfflineVotes,
  deleteCandidate,
  getCandidatesByDepartment
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes
router.get('/', getCandidates);
router.get('/department/:department', getCandidatesByDepartment);
router.get('/:id', getCandidate);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId(),
  body('position')
    .notEmpty().withMessage('Position is required')
    .isIn(['President', 'Congress Person', 'Male Delegate', 'Female Delegate'])
    .withMessage('Invalid position'),
  body('manifesto')
    .notEmpty().withMessage('Manifesto is required')
    .trim()
    .isLength({ max: 2000 }).withMessage('Manifesto cannot exceed 2000 characters'),
  body('department').optional().isString(),
  body('image').optional().isURL(),
  validate
], createCandidate);

router.put('/:id', [
  body('manifesto').optional().trim().isLength({ max: 2000 }),
  body('image').optional().isURL(),
  body('isApproved').optional().isBoolean(),
  validate
], updateCandidate);

router.patch('/:id/offlineVotes', [
  body('offlineVotes')
    .notEmpty().withMessage('Offline votes value is required')
    .isInt({ min: 0 }).withMessage('Offline votes must be a non-negative number'),
  validate
], updateOfflineVotes);

router.delete('/:id', deleteCandidate);

module.exports = router;
