const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
const throttle = require('./middleware/throttle');

// Load environment variables
dotenv.config();

// ... (rest of imports)

// Initialize express app
const app = express();
app.set('trust proxy', 1);

// Apply throttling first
app.use(throttle({ maxConcurrent: 100 }));

// Use compression
app.use(compression());

// Connect to database
connectDB();

// Security middleware - Enhanced helmet configuration
// Relaxed in development to prevent CSP issues with dynamic ports
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "https:*"]
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration...
// (skipped for brevity)

// General rate limiting & Bot detection
app.use('/api', (req, res, next) => {
  if (process.env.DEV_MODE === 'true') return next();
  botDetector(req, res, () => {
    generalLimiter(req, res, next);
  });
});

// Body parser middleware with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser middleware with security options
app.use(cookieParser(process.env.COOKIE_SECRET));

// Request logging middleware with IP tracking
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    'unknown';
  console.log(`${new Date().toISOString()} | ${clientIp} | ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/admin', adminRoutes);

// --- STATIC FILES & SPA ROUTING ---
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CoopVotes API is running',
    version: '2.0.0-secure',
    timestamp: new Date().toISOString(),
    security: {
      encryption: 'AES-256-GCM',
      hashing: 'SHA-256',
      rateLimiting: true,
      auditLogging: true
    }
  });
});

// Security check endpoint
app.get('/api/security/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      encryptionEnabled: !!process.env.VOTE_ENCRYPTION_KEY,
      rateLimitingEnabled: true,
      auditLoggingEnabled: true,
      strictEmailValidation: true,
      strictRegNumberValidation: true,
      features: [
        'AES-256-GCM Vote Encryption',
        'SHA-256 Hash Receipts',
        'Chained Vote Hashes',
        'Audit Logging',
        'Anomaly Detection',
        'Rate Limiting',
        'RBAC',
        'Data Sanitization'
      ]
    }
  });
});

// 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// SPA routing: Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global error handler
app.use(errorHandler);

// Server port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   CoopVotes Server - The Co-operative University of Kenya ║
║                                                           ║
║   Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}            ║
║   API: http://localhost:${PORT}                            ║
║                                                           ║
║   SECURITY FEATURES:                                      ║
║   ✓ AES-256-GCM Vote Encryption                           ║
║   ✓ SHA-256 Hash Receipts                               ║
║   ✓ Chained Vote Hashes                                   ║
║   ✓ Audit Logging                                         ║
║   ✓ Anomaly Detection                                     ║
║   ✓ Rate Limiting                                         ║
║   ✓ RBAC                                                  ║
║   ✓ Data Sanitization                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close();
    console.log('Server closed due to SIGTERM');
    process.exit(0);
  });
});

module.exports = app;
