const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validate');

/**
 * @desc    Cast a vote
 * @route   POST /api/vote
 * @access  Private/Student
 */
const castVote = asyncHandler(async (req, res) => {
  const { candidateId, position, department } = req.body;

  // Check if election is active
  const election = await Election.getActiveElection();
  if (!election) {
    return res.status(400).json({
      success: false,
      message: 'Voting is not currently active'
    });
  }

  // Verify user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can vote'
    });
  }

  // Check if user has already voted for this position
  const existingVote = await Vote.findOne({
    voterId: req.user.id,
    position,
    department: position === 'President' ? null : department
  });

  if (existingVote) {
    return res.status(400).json({
      success: false,
      message: `You have already voted for ${position}`
    });
  }

  // Verify candidate exists and is approved
  const candidate = await Candidate.findOne({
    _id: candidateId,
    position,
    isApproved: true
  });

  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found or not approved'
    });
  }

  // Department-based voting restriction
  if (position !== 'President' && candidate.department !== req.user.department) {
    return res.status(403).json({
      success: false,
      message: `You can only vote for ${position} candidates in your department (${req.user.department})`
    });
  }

  // Create vote and update candidate in a transaction
  const session = await Vote.startSession();
  session.startTransaction();

  try {
    // Create vote record
    const vote = await Vote.create([{
      voterId: req.user.id,
      candidateId,
      position,
      department: position === 'President' ? null : department,
      electionId: election._id
    }], { session });

    // Increment candidate votes
    candidate.votes += 1;
    await candidate.save({ session });

    // Update user's voted status
    req.user.hasVoted = true;
    if (!req.user.votedPositions.includes(position)) {
      req.user.votedPositions.push(position);
    }
    await req.user.save({ session });

    // Update election total votes and calculate turnout
    election.totalVotes += 1;
    election.turnout = election.totalVoters > 0 ? (election.totalVotes / election.totalVoters) * 100 : 0;
    await election.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        vote: vote[0],
        candidate: {
          id: candidate._id,
          name: candidate.userId.email,
          totalVotes: candidate.totalVotes
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Get user's vote status
 * @route   GET /api/vote/status
 * @access  Private
 */
const getVoteStatus = asyncHandler(async (req, res) => {
  const votes = await Vote.find({ voterId: req.user.id })
    .populate('candidateId', 'position department');

  const votedPositions = votes.map(v => ({
    position: v.position,
    department: v.department,
    candidateId: v.candidateId._id,
    votedAt: v.createdAt
  }));

  res.status(200).json({
    success: true,
    data: {
      hasVoted: req.user.hasVoted,
      votedPositions
    }
  });
});

/**
 * @desc    Get election results
 * @route   GET /api/vote/results
 * @access  Public
 */
const getResults = asyncHandler(async (req, res) => {
  const positions = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
  const departments = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU'];

  const results = {};

  for (const position of positions) {
    results[position] = {};

    if (position === 'President') {
      // President is global - no department filter
      const candidates = await Candidate.find({
        position,
        isApproved: true
      }).populate('userId', 'email regNumber').sort({ votes: -1 });

      results[position].global = candidates.map(c => ({
        id: c._id,
        name: c.userId.email,
        regNumber: c.userId.regNumber,
        votes: c.votes,
        offlineVotes: c.offlineVotes,
        totalVotes: c.totalVotes
      }));
    } else {
      // Department-based positions
      for (const dept of departments) {
        const candidates = await Candidate.find({
          position,
          department: dept,
          isApproved: true
        }).populate('userId', 'email regNumber').sort({ votes: -1 });

        results[position][dept] = candidates.map(c => ({
          id: c._id,
          name: c.userId.email,
          regNumber: c.userId.regNumber,
          votes: c.votes,
          offlineVotes: c.offlineVotes,
          totalVotes: c.totalVotes
        }));
      }
    }
  }

  // Get election info
  const election = await Election.getActiveElection();

  res.status(200).json({
    success: true,
    data: {
      election: election ? {
        id: election._id,
        name: election.name,
        year: election.year,
        totalVoters: election.totalVoters,
        totalVotes: election.totalVotes,
        turnout: election.turnout
      } : null,
      results
    }
  });
});

/**
 * @desc    Export results as CSV
 * @route   GET /api/vote/results/export
 * @access  Private/Admin
 */
const exportResults = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can export results'
    });
  }

  const positions = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
  const departments = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU'];

  let csv = 'Position,Department,Candidate Email,Reg Number,Online Votes,Offline Votes,Total Votes\n';

  for (const position of positions) {
    if (position === 'President') {
      const candidates = await Candidate.find({ position, isApproved: true })
        .populate('userId', 'email regNumber');

      for (const c of candidates) {
        csv += `${position},Global,${c.userId.email},${c.userId.regNumber},${c.votes},${c.offlineVotes},${c.totalVotes}\n`;
      }
    } else {
      for (const dept of departments) {
        const candidates = await Candidate.find({ position, department: dept, isApproved: true })
          .populate('userId', 'email regNumber');

        for (const c of candidates) {
          csv += `${position},${dept},${c.userId.email},${c.userId.regNumber},${c.votes},${c.offlineVotes},${c.totalVotes}\n`;
        }
      }
    }
  }

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename=election-results-${Date.now()}.csv`);
  res.send(csv);
});

module.exports = {
  castVote,
  getVoteStatus,
  getResults,
  exportResults
};
