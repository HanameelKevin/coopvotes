const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { login, getMe, logout, getElectionStatus } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/login', [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .custom((value) => {
      if (!value.endsWith('@student.cuk.ac.ke')) {
        throw new Error('Email must be a @student.cuk.ac.ke address');
      }
      return true;
    }),
  body('regNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .toUpperCase(),
  validate
], login);

router.get('/me', protect, getMe);

router.post('/logout', protect, logout);

router.get('/election-status', protect, getElectionStatus);

module.exports = router;
