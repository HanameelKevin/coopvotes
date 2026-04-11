const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Student Government Election'
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  positions: [{
    name: String,
    department: {
      type: String,
      default: null
    }
  }],
  totalVoters: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  turnout: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get active election
electionSchema.statics.getActiveElection = async function () {
  return await this.findOne({ isActive: true, status: 'active' });
};


const Election = mongoose.model('Election', electionSchema);

module.exports = Election;
