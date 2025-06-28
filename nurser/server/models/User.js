const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    sparse: true  // No unique here - will be defined in indexes section
  },
  username: {
    type: String,
    required: true,
    unique: true  // Only defined here (not duplicated)
  },
  email: {
    type: String,
    required: true
    // Removed unique: true - defined in indexes section
  },
  password: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['nurse', 'admin', 'head_nurse'],
    default: 'nurse'
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String
    // No unique/sparse here - defined in indexes section
  },
  specialization: {
    type: String,
    enum: ['ER', 'OR', 'Pediatrics', 'ICU', 'General', 'Cardiology', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Middleware (pre-save hooks)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/*******************************
 *         INDEXES             *
 *******************************/
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ githubId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);