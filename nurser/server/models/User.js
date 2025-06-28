const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  githubId: String,
  username: String,
  displayName: String,
  email: String,
  role: {
    type: String,
    enum: ['nurse', 'admin', 'supervisor'],
    default: 'nurse'
  },
  licenseNumber: String,
  specialization: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);