const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validate');

/**
 * @desc    Get current election status
 * @route   GET /api/election
 * @access  Public
 */
const getElection = asyncHandler(async (req, res) => {
  const election = await Election.findOne({ isActive: true });

  if (!election) {
    return res.status(200).json({
      success: true,
      data: {
        isActive: false,
        message: 'No active election'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      isActive: true,
      election: {
        id: election._id,
        name: election.name,
        year: election.year,
        status: election.status,
        startTime: election.startTime,
        endTime: election.endTime,
        totalVoters: election.totalVoters,
        totalVotes: election.totalVotes,
        turnout: election.turnout
      }
    }
  });
});

/**
 * @desc    Start a new election
 * @route   POST /api/election/start
 * @access  Private/Admin
 */
const startElection = asyncHandler(async (req, res) => {
  const { name, year, positions } = req.body;

  // Check if there's already an active election
  const activeElection = await Election.findOne({ isActive: true });
  if (activeElection) {
    return res.status(400).json({
      success: false,
      message: 'An election is already active. End it before starting a new one.'
    });
  }

  // Count eligible voters (students)
  const totalVoters = await User.countDocuments({ role: 'student' });

  // Create election
  const election = await Election.create({
    name: name || 'Student Government Election',
    year: year || new Date().getFullYear(),
    isActive: true,
    status: 'active',
    startTime: new Date(),
    totalVoters,
    positions: positions || [
      { name: 'President', department: null },
      { name: 'Congress Person', department: 'BIT' },
      { name: 'Congress Person', department: 'BBM' },
      { name: 'Congress Person', department: 'CS' },
      { name: 'Male Delegate', department: 'BIT' },
      { name: 'Male Delegate', department: 'BBM' },
      { name: 'Male Delegate', department: 'CS' },
      { name: 'Female Delegate', department: 'BIT' },
      { name: 'Female Delegate', department: 'BBM' },
      { name: 'Female Delegate', department: 'CS' }
    ]
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Election started successfully',
      election
    }
  });
});

/**
 * @desc    End current election
 * @route   POST /api/election/end
 * @access  Private/Admin
 */
const endElection = asyncHandler(async (req, res) => {
  const election = await Election.findOne({ isActive: true });

  if (!election) {
    return res.status(400).json({
      success: false,
      message: 'No active election to end'
    });
  }

  election.isActive = false;
  election.status = 'completed';
  election.endTime = new Date();
  await election.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Election ended successfully',
      election
    }
  });
});

/**
 * @desc    Get all elections (admin)
 * @route   GET /api/election/history
 * @access  Private/Admin
 */
const getElectionHistory = asyncHandler(async (req, res) => {
  const elections = await Election.find().sort({ year: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: elections.length,
    data: elections
  });
});

/**
 * @desc    Update election
 * @route   PUT /api/election/:id
 * @access  Private/Admin
 */
const updateElection = asyncHandler(async (req, res) => {
  const { name, status } = req.body;

  let election = await Election.findById(req.params.id);

  if (!election) {
    return res.status(404).json({
      success: false,
      message: 'Election not found'
    });
  }

  election = await Election.findByIdAndUpdate(
    req.params.id,
    {
      ...(name && { name }),
      ...(status && { status })
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: election
  });
});

/**
 * @desc    Delete election
 * @route   DELETE /api/election/:id
 * @access  Private/Admin
 */
const deleteElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    return res.status(404).json({
      success: false,
      message: 'Election not found'
    });
  }

  if (election.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete an active election. End it first.'
    });
  }

  await election.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Election deleted successfully'
  });
});

/**
 * @desc    Get election statistics
 * @route   GET /api/election/:id/stats
 * @access  Private/Admin
 */
const getElectionStats = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    return res.status(404).json({
      success: false,
      message: 'Election not found'
    });
  }

  // Get vote counts by position
  const voteCounts = await Vote.aggregate([
    { $match: { electionId: election._id } },
    { $group: { _id: '$position', count: { $sum: 1 } } }
  ]);

  // Get candidate stats
  const candidateStats = await Candidate.aggregate([
    { $match: { isApproved: true } },
    {
      $group: {
        _id: '$position',
        totalCandidates: { $sum: 1 },
        avgVotes: { $avg: '$votes' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      election: {
        name: election.name,
        status: election.status,
        totalVoters: election.totalVoters,
        totalVotes: election.totalVotes,
        turnout: election.turnout
      },
      voteCountsByPosition: voteCounts,
      candidateStats
    }
  });
});

module.exports = {
  getElection,
  startElection,
  endElection,
  getElectionHistory,
  updateElection,
  deleteElection,
  getElectionStats
};
