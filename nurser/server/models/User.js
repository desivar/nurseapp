// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    unique: true,
    sparse: true // Allows null values for non-Github users
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
    select: false // Never return password in queries
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
    unique: true,
    sparse: true
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);