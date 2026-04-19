const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { STRICT_REG_NUMBER_REGEX } = require('../utils/regParser');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // STRICT: Only allow @student.cuk.ac.ke emails
    match: [/^[a-zA-Z0-9._%+-]+@student\.cuk\.ac\.ke$/, 'Email must be a valid @student.cuk.ac.ke address']
  },
  regNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    // STRICT: Must match CXXX/XXXXXX/XXXX format
    validate: {
      validator: function (v) {
        return STRICT_REG_NUMBER_REGEX.test(v);
      },
      message: 'Registration number must be in format CXXX/XXXXXX/XXXX (e.g., C026/405411/2024)'
    },
    // IMMUTABLE: Cannot be changed after creation
    immutable: true
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
  },
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  // Security tracking
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
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

// Prevent modification of regNumber after creation
userSchema.pre('save', async function () {
  if (this.isModified('regNumber') && !this.isNew) {
    throw new Error('Registration number cannot be modified after creation');
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
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

// Static method to find by registration number
userSchema.statics.findByRegNumber = function (regNumber) {
  return this.findOne({ regNumber: regNumber.toUpperCase().trim() });
};

// Static method to check if regNumber exists
userSchema.statics.regNumberExists = async function (regNumber) {
  const count = await this.countDocuments({ regNumber: regNumber.toUpperCase().trim() });
  return count > 0;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
