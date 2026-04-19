const User = require('../models/User');
const Election = require('../models/Election');
const { sendTokenResponse } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validate');
const { parseRegNumber, validateRegNumberFormat } = require('../utils/regParser');
const { validateUniversityEmail } = require('../utils/emailValidator');
const { logAuth, checkSuspiciousActivity } = require('../middleware/auditLogger');
const { sanitizeUser } = require('../middleware/auditLogger');
const cache = require('../utils/cache');

/**
 * @desc    Login user with email and registration number
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, regNumber } = req.body;

  // Normalize email to lowercase
  const normalizedEmail = email?.toLowerCase().trim();

  // STRICT: Validate registration number format
  const regValidation = validateRegNumberFormat(regNumber);
  if (!regValidation.isValid) {
    await logAuth(req, 'LOGIN_FAILED', {
      reason: 'invalid_reg_number',
      email: normalizedEmail,
      error: regValidation.error
    }, 'medium');

    return res.status(400).json({
      success: false,
      message: regValidation.error
    });
  }

  // Parse registration number
  let parsedRegNumber;
  try {
    parsedRegNumber = parseRegNumber(regNumber);
  } catch (error) {
    await logAuth(req, 'LOGIN_FAILED', {
      reason: 'parse_error',
      email: normalizedEmail,
      error: error.message
    }, 'medium');

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Check for suspicious activity (brute force, etc.)
  const anomalies = await checkSuspiciousActivity(req, {
    identifier: normalizedEmail
  });

  if (anomalies.some(a => a.type === 'BRUTE_FORCE_ATTEMPT')) {
    return res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Account temporarily locked.'
    });
  }

  // Find existing user
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // First-time login - create user
    // STRICT: Check if regNumber is already used by another user
    const existingReg = await User.findOne({ regNumber: regValidation.normalized });
    if (existingReg) {
      await logAuth(req, 'LOGIN_FAILED', {
        reason: 'reg_number_already_used',
        email: normalizedEmail,
        regNumber: regValidation.normalized
      }, 'high');

      return res.status(400).json({
        success: false,
        message: 'This registration number is already associated with another account'
      });
    }

    try {
      user = await User.create({
        email: normalizedEmail,
        regNumber: regValidation.normalized,
        department: parsedRegNumber.department,
        admissionYear: parsedRegNumber.admissionYear,
        yearOfStudy: parsedRegNumber.yearOfStudy,
        role: parsedRegNumber.isAdmin ? 'admin' : 'student'
      });

      await logAuth(req, 'LOGIN', {
        type: 'new_user_created',
        userId: user._id,
        department: user.department
      }, 'low');
    } catch (error) {
      await logAuth(req, 'LOGIN_FAILED', {
        reason: 'user_creation_failed',
        email: normalizedEmail,
        error: error.message
      }, 'high');

      return res.status(500).json({
        success: false,
        message: 'Failed to create user account'
      });
    }
  } else {
    // STRICT: Verify regNumber matches on subsequent logins
    if (user.regNumber !== regValidation.normalized) {
      await logAuth(req, 'LOGIN_FAILED', {
        reason: 'reg_number_mismatch',
        email: normalizedEmail,
        providedRegNumber: regValidation.normalized,
        expectedRegNumber: user.regNumber
      }, 'high');

      return res.status(403).json({
        success: false,
        message: 'Registration number does not match our records'
      });
    }

    // Check for multi-IP login anomaly
    const multiIpAnomaly = anomalies.find(a => a.type === 'MULTI_IP_LOGIN');
    if (multiIpAnomaly) {
      await logAuth(req, 'MULTI_IP_LOGIN', {
        uniqueIpCount: multiIpAnomaly.details.uniqueIpCount,
        severity: 'high'
      }, 'high');
    }

    // Update year of study dynamically
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    const newYearOfStudy = Math.min(Math.max(academicYear - user.admissionYear + 1, 1), 6);

    if (newYearOfStudy !== user.yearOfStudy) {
      user.yearOfStudy = newYearOfStudy;
      await user.save();
    }

    // Update last login info
    user.lastLoginAt = new Date();
    await user.save();

    await logAuth(req, 'LOGIN', {
      type: 'returning_user',
      userId: user._id
    }, 'low');
  }

  // --- 2FA OTP Generation ---
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  // OTP valid for 10 minutes
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // Send OTP via email
  const { sendEmail } = require('../utils/email');
  const emailSent = await sendEmail({
    to: normalizedEmail,
    subject: 'Your CoopVotes Login OTP',
    html: `
      <h2>Login Verification</h2>
      <p>Your One-Time Password (OTP) for CoopVotes is: <strong>${otp}</strong></p>
      <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
    `
  });

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP email. Please try logging in again.'
    });
  }

  // Send temporary success (without JWT)
  res.status(200).json({
    success: true,
    message: 'OTP sent to your email',
    data: {
      userId: user._id,
      email: user.email,
      requiresOtp: true
    }
  });
});

/**
 * @desc    Verify OTP and finalize login
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: 'User ID and OTP are required'
    });
  }

  const user = await User.findById(userId).select('+otp +otpExpires');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isLocked()) {
    return res.status(429).json({
      success: false,
      message: 'Account is temporarily locked'
    });
  }

  // Check OTP
  if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
    await logAuth(req, 'LOGIN_FAILED', {
      reason: 'invalid_or_expired_otp',
      userId
    }, 'high');

    await user.incrementLoginAttempts();

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }

  // OTP valid, clear it and reset login attempts
  user.otp = undefined;
  user.otpExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await logAuth(req, 'LOGIN_SUCCESS', {
    type: 'otp_verified',
    userId: user._id
  }, 'low');

  // Send final token response
  const sanitizedUser = sanitizeUser(user);
  sendTokenResponse({ ...user.toObject(), ...sanitizedUser }, 200, res);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Return sanitized user data (no regNumber exposed)
  res.status(200).json({
    success: true,
    data: sanitizeUser(user)
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  await logAuth(req, 'LOGOUT', {
    userId: req.user._id
  }, 'low');

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Check if election is active
 * @route   GET /api/auth/election-status
 * @access  Private
 */
const getElectionStatus = asyncHandler(async (req, res) => {
  const cachedStatus = cache.get("electionStatus");
  if (cachedStatus) {
    return res.status(200).json({
      success: true,
      data: cachedStatus,
      cached: true
    });
  }

  const election = await Election.getActiveElection();

  const data = {
    isActive: !!election,
    election: election ? {
      id: election._id,
      name: election.name,
      year: election.year,
      startTime: election.startTime,
      endTime: election.endTime
    } : null
  };

  cache.set("electionStatus", data, 60); // Cache for 1 minute

  res.status(200).json({
    success: true,
    data
  });
});

module.exports = {
  login,
  verifyOtp,
  getMe,
  logout,
  getElectionStatus
};
