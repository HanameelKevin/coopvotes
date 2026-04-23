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
      // Allow any email in development, or if DEV_OTP is enabled (for testing)
      const allowAnyEmail = process.env.NODE_ENV !== 'production' || process.env.DEV_OTP === 'true';
      if (!allowAnyEmail && !value.toLowerCase().endsWith('@student.cuk.ac.ke')) {
        throw new Error('Email must be a @student.cuk.ac.ke address');
      }
      return true;
    }),
  body('regNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .custom((value) => {
      const { STRICT_REG_NUMBER_REGEX, FLEXIBLE_REG_NUMBER_REGEX } = require('../utils/regParser');
      const normalized = value.trim().toUpperCase().replace(/-/g, '/');
      // In development or DEV_OTP mode, allow flexible formats (e.g., B08/1234/2023)
      // In production, enforce strict format (e.g., C026/405411/2024)
      const allowFlexible = process.env.NODE_ENV !== 'production' || process.env.DEV_OTP === 'true';
      const regex = allowFlexible ? FLEXIBLE_REG_NUMBER_REGEX : STRICT_REG_NUMBER_REGEX;
      if (!regex.test(normalized)) {
        const hint = allowFlexible
          ? 'Invalid registration number format. Expected: C026/405411/2024 or B08/1234/23'
          : 'Invalid registration number format. Expected: C026/405411/2024';
        throw new Error(hint);
      }
      return true;
    })
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
