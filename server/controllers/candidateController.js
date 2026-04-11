const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validate');

/**
 * @desc    Get all candidates with filters
 * @route   GET /api/candidates
 * @access  Public
 */
const getCandidates = asyncHandler(async (req, res) => {
  const { position, department, approved } = req.query;

  const query = {};

  if (position) {
    query.position = position;
  }

  if (department && position !== 'President') {
    query.department = department;
  }

  if (approved !== undefined) {
    query.isApproved = approved === 'true';
  }

  const candidates = await Candidate.find(query)
    .populate('userId', 'email regNumber department yearOfStudy')
    .sort({ position: 1, votes: -1 });

  res.status(200).json({
    success: true,
    count: candidates.length,
    data: candidates
  });
});

/**
 * @desc    Get single candidate
 * @route   GET /api/candidates/:id
 * @access  Public
 */
const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id)
    .populate('userId', 'email regNumber department');

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  res.status(200).json({
    success: true,
    data: candidate
  });
});

/**
 * @desc    Create new candidate
 * @route   POST /api/candidates
 * @access  Private/Admin
 */
const createCandidate = asyncHandler(async (req, res) => {
  const { userId, position, department, manifesto, image } = req.body;

  // Validate position
  const validPositions = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
  if (!validPositions.includes(position)) {
    return res.status(400).json({
      success: false,
      message: `Invalid position. Must be one of: ${validPositions.join(', ')}`
    });
  }

  // Department required for non-President positions
  if (position !== 'President' && !department) {
    return res.status(400).json({
      success: false,
      message: 'Department is required for this position'
    });
  }

  // President cannot have department
  if (position === 'President' && department) {
    return res.status(400).json({
      success: false,
      message: 'President position should not have a department'
    });
  }

  const candidate = await Candidate.create({
    userId,
    position,
    department: department || null,
    manifesto,
    image,
    isApproved: true,
    approvedBy: req.user.id,
    approvedAt: new Date()
  });

  res.status(201).json({
    success: true,
    data: candidate
  });
});

/**
 * @desc    Update candidate
 * @route   PUT /api/candidates/:id
 * @access  Private/Admin
 */
const updateCandidate = asyncHandler(async (req, res) => {
  let candidate = await Candidate.findById(req.params.id);

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  const { manifesto, image, isApproved } = req.body;

  candidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    {
      ...(manifesto && { manifesto }),
      ...(image && { image }),
      ...(isApproved !== undefined && {
        isApproved,
        approvedBy: req.user.id,
        approvedAt: new Date()
      })
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: candidate
  });
});

/**
 * @desc    Update offline votes for candidate
 * @route   PATCH /api/candidates/:id/offlineVotes
 * @access  Private/Admin
 */
const updateOfflineVotes = asyncHandler(async (req, res) => {
  const { offlineVotes } = req.body;

  if (typeof offlineVotes !== 'number' || offlineVotes < 0) {
    return res.status(400).json({
      success: false,
      message: 'Offline votes must be a non-negative number'
    });
  }

  let candidate = await Candidate.findById(req.params.id);

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  candidate.offlineVotes = offlineVotes;
  await candidate.save();

  res.status(200).json({
    success: true,
    data: candidate
  });
});

/**
 * @desc    Delete candidate
 * @route   DELETE /api/candidates/:id
 * @access  Private/Admin
 */
const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  await candidate.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Candidate deleted successfully'
  });
});

/**
 * @desc    Get candidates by department for voting
 * @route   GET /api/candidates/department/:department
 * @access  Public
 */
const getCandidatesByDepartment = asyncHandler(async (req, res) => {
  const { department } = req.params;
  const { position } = req.query;

  const query = {
    isApproved: true,
    department
  };

  if (position) {
    query.position = position;
  }

  const candidates = await Candidate.find(query)
    .populate('userId', 'email regNumber')
    .sort({ votes: -1 });

  res.status(200).json({
    success: true,
    count: candidates.length,
    data: candidates
  });
});

module.exports = {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  updateOfflineVotes,
  deleteCandidate,
  getCandidatesByDepartment
};
