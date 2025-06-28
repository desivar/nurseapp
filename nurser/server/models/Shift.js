const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  requiredStaff: {
    type: Number,
    required: true
  },
  assignedNurses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  }
});

module.exports = mongoose.model('Shift', shiftSchema);