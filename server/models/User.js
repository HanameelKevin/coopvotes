const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@student\.cuk\.ac\.ke$/, 'Please use a valid @student.cuk.ac.ke email']
  },
  regNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    required: true,
    enum: ['BIT', 'BBM', 'CS', 'COMM', 'LAW', 'EDU', 'ADMIN']
  },
  yearOfStudy: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  admissionYear: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'aspirant', 'admin'],
    default: 'student'
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votedPositions: [{
    type: String
  }],
  password: {
    type: String,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    select: false
  },
  verificationCodeExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full department name
userSchema.virtual('departmentName').get(function () {
  const deptMap = {
    'BIT': 'Business Information Technology',
    'BBM': 'Business Management',
    'CS': 'Computer Science',
    'COMM': 'Commerce',
    'LAW': 'Law',
    'EDU': 'Education',
    'ADMIN': 'Administration'
  };
  return deptMap[this.department] || this.department;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
