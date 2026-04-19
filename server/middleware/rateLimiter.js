const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
  skip: (req) => req.user?.role === 'admin',
});

// Auth/Login rate limiter (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // strict limit for auth
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true,
});

// Vote casting rate limiter (very strict)
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
  message: 'Too many vote attempts. Please try again later.',
});

// Verify vote rate limiter
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // general verification limit
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
});

// Export all limiters
module.exports = {
  generalLimiter,
  authLimiter,
  voteLimiter,
  verifyLimiter,
  // Keep default export for backward compatibility
  default: generalLimiter,
};