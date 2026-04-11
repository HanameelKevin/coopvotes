const User = require('../models/User');
const Election = require('../models/Election');
const { protect, sendTokenResponse } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validate');
const { parseRegNumber } = require('../utils/regParser');
const { validateUniversityEmail } = require('../utils/emailValidator');

/**
 * @desc    Login user with email and registration number
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, regNumber } = req.body;

  // Validate email
  const emailValidation = validateUniversityEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: emailValidation.error
    });
  }

  // Parse registration number
  let parsedRegNumber;
  try {
    parsedRegNumber = parseRegNumber(regNumber);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Find or create user
  let user = await User.findOne({ email: emailValidation.email });

  if (!user) {
    // First-time login - create user
    user = await User.create({
      email: emailValidation.email,
      regNumber: regNumber.trim().toUpperCase(),
      department: parsedRegNumber.department,
      admissionYear: parsedRegNumber.admissionYear,
      yearOfStudy: parsedRegNumber.yearOfStudy,
      role: parsedRegNumber.isAdmin ? 'admin' : 'student'
    });
  } else {
    // Update year of study dynamically
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    const newYearOfStudy = Math.min(Math.max(academicYear - user.admissionYear + 1, 1), 6);

    if (newYearOfStudy !== user.yearOfStudy) {
      user.yearOfStudy = newYearOfStudy;
      await user.save();
    }
  }

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      regNumber: user.regNumber,
      department: user.department,
      departmentName: user.departmentName,
      yearOfStudy: user.yearOfStudy,
      admissionYear: user.admissionYear,
      role: user.role,
      hasVoted: user.hasVoted,
      votedPositions: user.votedPositions,
      isVerified: user.isVerified
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
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
  const election = await Election.getActiveElection();

  res.status(200).json({
    success: true,
    data: {
      isActive: !!election,
      election: election ? {
        id: election._id,
        name: election.name,
        year: election.year,
        startTime: election.startTime,
        endTime: election.endTime
      } : null
    }
  });
});

module.exports = {
  login,
  getMe,
  logout,
  getElectionStatus
};
