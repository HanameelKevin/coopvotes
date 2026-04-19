const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: ['President', 'Congress Person', 'Male Delegate', 'Female Delegate']
  },
  department: {
    type: String,
    enum: ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU', null],
    default: null
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  // Encrypted vote data for end-to-end encryption
  encryptedVoteData: {
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    algorithm: { type: String, default: 'aes-256-gcm' }
  },
  // Vote receipt hash for verification (SHA-256)
  receiptHash: {
    type: String,
    required: true,
    unique: true
  },
  // Chained hash for anti-tampering (blockchain-like integrity)
  chainedHash: {
    type: String,
    required: true
  },
  previousHash: {
    type: String,
    default: 'genesis'
  },
  // Audit metadata
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  // Verification proof (simplified ZKP concept)
  verificationProof: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// CRITICAL: Compound index to prevent double voting at database level
voteSchema.index({ voterId: 1, position: 1 }, { unique: true });

// Unique index for receipt verification (already in schema as unique: true)
// Index for chained hash verification 
voteSchema.index({ chainedHash: 1 });

// Static method to check if user has voted for a position
voteSchema.statics.hasVotedForPosition = async function (voterId, position, department) {
  const vote = await this.findOne({ voterId, position, department });
  return !!vote;
};

// Static method to get user's votes (with sensitive data excluded)
voteSchema.statics.getUserVotes = async function (voterId) {
  return await this.find({ voterId })
    .select('-encryptedVoteData -ipAddress -userAgent')
    .populate('candidateId', 'position department');
};

// Static method to get the last vote hash for chaining
voteSchema.statics.getLastHash = async function () {
  const lastVote = await this.findOne().sort({ createdAt: -1 });
  return lastVote ? lastVote.chainedHash : 'genesis';
};

// Static method to verify vote by receipt hash
voteSchema.statics.verifyByReceipt = async function (receiptHash) {
  const vote = await this.findOne({ receiptHash })
    .select('-encryptedVoteData -ipAddress -userAgent');
  return vote;
};

// Static method to verify vote chain integrity
voteSchema.statics.verifyChain = async function () {
  const votes = await this.find()
    .sort({ createdAt: 1 })
    .select('chainedHash previousHash createdAt');

  for (let i = 0; i < votes.length; i++) {
    const expectedPreviousHash = i === 0 ? 'genesis' : votes[i - 1].chainedHash;
    if (votes[i].previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAt: votes[i]._id,
        expected: expectedPreviousHash,
        actual: votes[i].previousHash
      };
    }
  }

  return { valid: true, totalVotes: votes.length };
};

// Static method to get vote count for anomaly detection
voteSchema.statics.getVoteCountInWindow = async function (position, department, minutes) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const query = { position, createdAt: { $gte: since } };
  if (department) query.department = department;
  return await this.countDocuments(query);
};

const Vote = mongoose.model('Vote', voteSchema);

// Note: The compound index on { voterId, position } with unique: true 
// is already defined in the schema above and handles double voting prevention
// MongoDB will allow multiple null values in unique index for department field

module.exports = Vote;
