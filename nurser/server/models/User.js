// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,

    sparse: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
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
    type: String,
    
    
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
userSchema.index({ licenseNumber: 1 }, );
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);