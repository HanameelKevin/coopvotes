const { rateLimit } = require('express-rate-limit');
const NodeCache = require('node-cache');

// Simple in-memory cache for bot detection/IP reputation
const ipReputationCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

// Helper to get client IP reliably
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.ip ||
         'unknown';
};

// Custom key generator for rate limiters
const keyGenerator = (req) => getClientIp(req);

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for general use
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for IP: ${getClientIp(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  },
  skip: (req) => {
    // Bypass for admin if authenticated
    return req.user?.role === 'admin' || process.env.DEV_MODE === 'true';
  },
});

// Auth/Login rate limiter (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: false,
});

// Vote casting rate limiter (very strict)
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Maximum voting attempts reached. Please contact support if you believe this is an error.'
  },
});

// Basic Bot Detection Middleware
const botDetector = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = getClientIp(req);

  // Simple heuristics for bots
  const botKeywords = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python', 'axios'];
  const isBot = botKeywords.some(keyword => userAgent.toLowerCase().includes(keyword));

  if (isBot) {
    const reputation = ipReputationCache.get(ip) || 0;
    ipReputationCache.set(ip, reputation + 1);
    
    // Log suspicious activity
    console.warn(`Suspicious activity detected from IP: ${ip} (User-Agent: ${userAgent})`);
    
    if (reputation > 5) {
      return res.status(403).json({
        success: false,
        message: 'Access denied due to suspicious activity.'
      });
    }
  }

  next();
};

// Export all limiters and middleware
module.exports = {
  generalLimiter,
  authLimiter,
  voteLimiter,
  botDetector,
  getClientIp
};
