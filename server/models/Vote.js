const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    enum: ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU', null]
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate votes
voteSchema.index({ voterId: 1, position: 1, department: 1 }, { unique: true });

// Static method to check if user has voted for a position
voteSchema.statics.hasVotedForPosition = async function(voterId, position, department) {
  const vote = await this.findOne({ voterId, position, department });
  return !!vote;
};

// Static method to get user's votes
voteSchema.statics.getUserVotes = async function(voterId) {
  return await this.find({ voterId }).populate('candidateId', 'position department');
};

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
