const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { login, verifyOtp, getMe, logout, getElectionStatus } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .custom((value) => {
      if (!value.toLowerCase().endsWith('@student.cuk.ac.ke')) {
        throw new Error('Email must be a @student.cuk.ac.ke address');
      }
      return true;
    }),
  body('regNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .matches(/^C[0-9]{3}\/[0-9]{6}\/[0-9]{4}$/)
    .withMessage('Registration number must be in format CXXX/XXXXXX/XXXX (e.g., C026/405411/2024)')
    .toUpperCase(),
  validate
], login);

router.post('/verify-otp', authLimiter, [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId(),
  body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate
], verifyOtp);

router.get('/me', protect, getMe);

router.post('/logout', protect, logout);

router.get('/election-status', protect, getElectionStatus);

module.exports = router;
