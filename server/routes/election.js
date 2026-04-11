const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getElection,
  startElection,
  endElection,
  getElectionHistory,
  updateElection,
  deleteElection,
  getElectionStats
} = require('../controllers/electionController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public route
router.get('/', getElection);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/start', [
  body('name').optional().trim(),
  body('year').optional().isInt({ min: 2020, max: 2100 }),
  body('positions').optional().isArray(),
  validate
], startElection);

router.post('/end', endElection);

router.get('/history', getElectionHistory);

router.get('/:id/stats', getElectionStats);

router.put('/:id', [
  body('name').optional().trim(),
  body('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']),
  validate
], updateElection);

router.delete('/:id', deleteElection);

module.exports = router;
