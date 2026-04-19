const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/validate');
const { logVote, sanitizeVote } = require('../middleware/auditLogger');
const { checkSuspiciousActivity } = require('../middleware/auditLogger');
const {
  encryptVote,
  generateVoteReceiptHash,
  generateChainedHash
} = require('../utils/encryption');
const { detectVoteSpike, detectMultiVoteFromIp } = require('../utils/anomalyDetection');
const cache = require('../utils/cache');

/**
 * @desc    Cast a vote with encryption and hash receipt
 * @route   POST /api/vote
 * @access  Private/Student
 */
const castVote = asyncHandler(async (req, res) => {
  const { candidateId, position } = req.body;

  // Derive department on server-side to prevent tampering
  const department = position === 'President' ? null : req.user.department;

  // Check if election is active and within time boundaries
  const election = await Election.getActiveElection();
  if (!election) {
    await logVote(req, 'VOTE_FAILED', {}, {
      reason: 'no_active_election',
      candidateId,
      position
    });

    return res.status(400).json({
      success: false,
      message: 'Voting is not currently active'
    });
  }

  const now = new Date();
  if (election.startTime && now < election.startTime) {
    return res.status(400).json({
      success: false,
      message: `Voting has not started yet. It begins at ${election.startTime.toLocaleString()}`
    });
  }

  if (election.endTime && now > election.endTime) {
    // Automatically close election if time passed
    election.isActive = false;
    election.status = 'completed';
    await election.save();

    return res.status(400).json({
      success: false,
      message: 'Voting period has ended'
    });
  }

  // Verify user is a student (or admin for testing)
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only students can vote'
    });
  }

  // Check for suspicious activity
  const anomalies = await checkSuspiciousActivity(req, {
    position,
    department
  });

  const criticalAnomaly = anomalies.find(a => a.severity === 'critical');
  if (criticalAnomaly) {
    return res.status(403).json({
      success: false,
      message: 'Suspicious activity detected. Vote blocked for security.'
    });
  }

  // Check for vote spikes
  const voteSpike = await detectVoteSpike(position, department);
  if (voteSpike.isAnomaly) {
    await logVote(req, 'VOTE_FAILED', { position, department }, {
      reason: 'vote_spike_detected',
      details: voteSpike.details
    });
  }

  // Verify candidate exists, is approved, and belongs to user's department (if not President)
  const candidateQuery = {
    _id: candidateId,
    position,
    isApproved: true
  };
  if (position !== 'President') {
    candidateQuery.department = req.user.department;
  }

  const candidate = await Candidate.findOne(candidateQuery);

  if (!candidate) {
    await logVote(req, 'VOTE_FAILED', { position, department }, {
      reason: 'candidate_not_found_or_wrong_department',
      candidateId
    });

    return res.status(404).json({
      success: false,
      message: 'Candidate not found, not approved, or not in your department'
    });
  }

  // Department-based voting restriction
  if (position !== 'President' && candidate.department !== req.user.department) {
    await logVote(req, 'VOTE_FAILED', { position, department }, {
      reason: 'department_mismatch',
      userDepartment: req.user.department,
      candidateDepartment: candidate.department
    });

    return res.status(403).json({
      success: false,
      message: `You can only vote for ${position} candidates in your department (${req.user.department})`
    });
  }

  // Create vote and update candidate in a transaction
  const session = await Vote.startSession();
  session.startTransaction();

  let vote;
  try {
    // DOUBLE VOTING PREVENTION: Check again inside transaction
    const existingVote = await Vote.findOne({
      voterId: req.user.id,
      position,
      department: position === 'President' ? null : department
    }).session(session);

    if (existingVote) {
      await session.abortTransaction();
      session.endSession();

      await logVote(req, 'VOTE_FAILED', { position, department }, {
        reason: 'already_voted',
        existingVoteId: existingVote._id
      });

      return res.status(400).json({
        success: false,
        message: `You have already voted for ${position}`,
        receiptHash: existingVote.receiptHash // Provide receipt for verification
      });
    }

    // Get previous hash for chain integrity
    const previousHash = await Vote.getLastHash();

    // Create vote data for encryption
    const voteData = {
      voterId: req.user.id.toString(),
      candidateId: candidateId.toString(),
      position,
      department: position === 'President' ? null : department,
      electionId: election._id.toString(),
      timestamp: new Date().toISOString()
    };

    // Encrypt vote data
    const encryptedVote = encryptVote(voteData);

    // Generate receipt hash
    const receiptHash = generateVoteReceiptHash(
      req.user.id.toString(),
      position,
      candidateId.toString(),
      new Date()
    );

    // Generate chained hash for anti-tampering
    const chainedHash = generateChainedHash(voteData, previousHash);

    // Create vote record with all security features
    const voteRecords = await Vote.create([{
      voterId: req.user.id,
      candidateId,
      position,
      department: position === 'President' ? null : department,
      electionId: election._id,
      encryptedVoteData: encryptedVote,
      receiptHash,
      chainedHash,
      previousHash,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown'
    }], { session });

    vote = voteRecords[0];

    // Increment candidate votes
    candidate.votes += 1;
    await candidate.save({ session });

    // Update user's voted status
    const user = await User.findById(req.user.id).session(session);
    user.hasVoted = true;
    if (!user.votedPositions.includes(position)) {
      user.votedPositions.push(position);
    }
    await user.save({ session });

    // Update election total votes and calculate turnout
    election.totalVotes += 1;
    election.turnout = election.totalVoters > 0 ? (election.totalVotes / election.totalVoters) * 100 : 0;
    await election.save({ session });

    await session.commitTransaction();

    // Log successful vote
    await logVote(req, 'VOTE_CAST', {
      position,
      department: position === 'President' ? null : department,
      candidateId,
      electionId: election._id
    }, {
      receiptHash,
      chainedHash: chainedHash.substring(0, 16) + '...' // Truncated for privacy
    });

    // Return vote receipt to user
    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        receipt: {
          hash: receiptHash,
          timestamp: vote.createdAt,
          position,
          department: position === 'President' ? null : department
        },
        verificationUrl: `/api/vote/verify?hash=${receiptHash}`
      }
    });
  } catch (error) {
    await session.abortTransaction();

    await logVote(req, 'VOTE_FAILED', { position, department }, {
      reason: 'transaction_error',
      error: error.message
    });

    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Verify a vote by receipt hash
 * @route   GET /api/vote/verify
 * @access  Public
 */
const verifyVote = asyncHandler(async (req, res) => {
  const { hash } = req.query;

  if (!hash) {
    return res.status(400).json({
      success: false,
      message: 'Receipt hash is required'
    });
  }

  // Verify the hash format (SHA-256 = 64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid receipt hash format'
    });
  }

  const vote = await Vote.verifyByReceipt(hash);

  if (!vote) {
    await logVote(req, 'VOTE_VERIFIED', {}, {
      hash: hash.substring(0, 16) + '...',
      result: 'not_found'
    });

    return res.status(404).json({
      success: false,
      message: 'Vote not found. Invalid receipt hash.'
    });
  }

  await logVote(req, 'VOTE_VERIFIED', {
    position: vote.position,
    department: vote.department
  }, {
    hash: hash.substring(0, 16) + '...',
    result: 'verified',
    votedAt: vote.createdAt
  });

  res.status(200).json({
    success: true,
    message: 'Vote verified successfully',
    data: {
      status: 'Vote Recorded',
      position: vote.position,
      department: vote.department,
      timestamp: vote.createdAt,
      verifiedAt: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get user's vote status with receipts
 * @route   GET /api/vote/status
 * @access  Private
 */
const getVoteStatus = asyncHandler(async (req, res) => {
  const votes = await Vote.find({ voterId: req.user.id })
    .select('-encryptedVoteData -ipAddress -userAgent -chainedHash -previousHash')
    .populate('candidateId', 'position department');

  const votedPositions = votes.map(v => ({
    position: v.position,
    department: v.department,
    receiptHash: v.receiptHash,
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
 * @desc    Get election results (sanitized - no reg numbers)
 * @route   GET /api/vote/results
 * @access  Public
 */
const getResults = asyncHandler(async (req, res) => {
  // Try to hit cache first
  const cachedResults = cache.get("voteResults");
  if (cachedResults) {
    return res.status(200).json({
      success: true,
      data: cachedResults,
      cached: true
    });
  }

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
      }).populate('userId', 'email department').sort({ votes: -1 });

      results[position].global = candidates.map(c => ({
        id: c._id,
        name: c.userId.email.split('@')[0], // Only show username, not full email
        department: c.userId.department,
        votes: c.votes,
        offlineVotes: c.offlineVotes,
        totalVotes: c.totalVotes
        // STRICT: No regNumber exposed
      }));
    } else {
      // Department-based positions
      for (const dept of departments) {
        const candidates = await Candidate.find({
          position,
          department: dept,
          isApproved: true
        }).populate('userId', 'email department').sort({ votes: -1 });

        results[position][dept] = candidates.map(c => ({
          id: c._id,
          name: c.userId.email.split('@')[0],
          department: c.userId.department,
          votes: c.votes,
          offlineVotes: c.offlineVotes,
          totalVotes: c.totalVotes
          // STRICT: No regNumber exposed
        }));
      }
    }
  }

  // Get election info
  const election = await Election.getActiveElection();

  const data = {
    election: election ? {
      id: election._id,
      name: election.name,
      year: election.year,
      totalVoters: election.totalVoters,
      totalVotes: election.totalVotes,
      turnout: election.turnout
    } : null,
    results
  };

  // Set cache holding time: 10 seconds (highly volatile)
  cache.set("voteResults", data, 10);

  res.status(200).json({
    success: true,
    data
  });
});

/**
 * @desc    Verify vote chain integrity
 * @route   GET /api/vote/verify-chain
 * @access  Private/Admin
 */
const verifyVoteChain = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can verify vote chain'
    });
  }

  const verification = await Vote.verifyChain();

  res.status(200).json({
    success: true,
    data: verification
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

  let csv = 'Position,Department,Candidate Email,Votes,Offline Votes,Total Votes\n';

  for (const position of positions) {
    if (position === 'President') {
      const candidates = await Candidate.find({ position, isApproved: true })
        .populate('userId', 'email');

      for (const c of candidates) {
        // Mask email for privacy in export
        const maskedEmail = c.userId.email.replace(/(.{2}).*@/, '$1***@');
        csv += `${position},Global,${maskedEmail},${c.votes},${c.offlineVotes},${c.totalVotes}\n`;
      }
    } else {
      for (const dept of departments) {
        const candidates = await Candidate.find({ position, department: dept, isApproved: true })
          .populate('userId', 'email');

        for (const c of candidates) {
          const maskedEmail = c.userId.email.replace(/(.{2}).*@/, '$1***@');
          csv += `${position},${dept},${maskedEmail},${c.votes},${c.offlineVotes},${c.totalVotes}\n`;
        }
      }
    }
  }

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename=election-results-${Date.now()}.csv`);
  res.send(csv);
});

/**
 * @desc    Export results as PDF
 * @route   GET /api/vote/results/export/pdf
 * @access  Private/Admin
 */
const exportResultsPDF = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can export results'
    });
  }

  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });

  res.header('Content-Type', 'application/pdf');
  res.header('Content-Disposition', `attachment; filename=election-results-${Date.now()}.pdf`);
  
  doc.pipe(res);

  doc.text('Co-operative University of Kenya', { align: 'center', underline: true });
  doc.fontSize(20).text('Official Election Results', { align: 'center' });
  doc.moveDown(2);

  const positions = ['President', 'Congress Person', 'Male Delegate', 'Female Delegate'];
  const departments = ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU'];

  for (const position of positions) {
    doc.fontSize(16).fillColor('#2d6a4f').text(position);
    doc.moveDown(0.5);

    if (position === 'President') {
      const candidates = await Candidate.find({ position, isApproved: true })
        .populate('userId', 'email').sort({ votes: -1 });

      candidates.forEach((c, idx) => {
        const maskedEmail = c.userId.email.replace(/(.{2}).*@/, '$1***@');
        doc.fontSize(12).fillColor('#333')
          .text(`${idx + 1}. ${maskedEmail} - ${c.totalVotes} Votes (Offline: ${c.offlineVotes})`);
      });
      doc.moveDown();
    } else {
      for (const dept of departments) {
        const candidates = await Candidate.find({ position, department: dept, isApproved: true })
          .populate('userId', 'email').sort({ votes: -1 });

        if (candidates.length > 0) {
          doc.fontSize(14).fillColor('#000').text(`Dept: ${dept}`);
          candidates.forEach((c, idx) => {
            const maskedEmail = c.userId.email.replace(/(.{2}).*@/, '$1***@');
            doc.fontSize(12).fillColor('#333')
              .text(`  ${idx + 1}. ${maskedEmail} - ${c.totalVotes} Votes (Offline: ${c.offlineVotes})`);
          });
          doc.moveDown();
        }
      }
    }
  }

  const election = await Election.getActiveElection();
  if (election) {
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray').text(`Total Votes Cast: ${election.totalVotes}`, { align: 'right' });
    doc.text(`Generated at: ${new Date().toLocaleString()}`, { align: 'right' });
  }

  doc.end();
});

module.exports = {
  castVote,
  verifyVote,
  getVoteStatus,
  getResults,
  verifyVoteChain,
  exportResults,
  exportResultsPDF
};
