const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  manifesto: {
    type: String,
    required: [true, 'Manifesto is required'],
    maxlength: [2000, 'Manifesto cannot exceed 2000 characters']
  },
  image: {
    type: String,
    default: '/uploads/default-candidate.png'
  },
  votes: {
    type: Number,
    default: 0
  },
  offlineVotes: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for total votes
candidateSchema.virtual('totalVotes').get(function() {
  return this.votes + this.offlineVotes;
});

// Index for efficient queries
candidateSchema.index({ position: 1, department: 1 });

// Static method to get results
candidateSchema.statics.getResults = async function(position, department) {
  const query = { position, isApproved: true };
  if (department && position !== 'President') {
    query.department = department;
  }

  const candidates = await this.find(query).populate('userId', 'email regNumber department').sort({ totalVotes: -1 });
  return candidates;
};

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
