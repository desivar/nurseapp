// server/models/Duty.js
const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
  nurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A duty must be assigned to a nurse']
  },
  patient: {
     type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'A duty must be assigned to a patient']
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'A duty must be assigned to a shift']
  },
   tasks: [{
    description: {
      type: String,
      required: [true, 'Task must have a description']
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
   status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: [true, 'Duty must have a start time']
  },
   updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});// Add duration virtual property
dutySchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60); // Hours
});
// Update timestamp before saving
dutySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Duty', dutySchema);
/*******************************
 *         INDEXES             *
 *******************************/
dutySchema.index({ nurse: 1, status: 1 });
dutySchema.index({ patient: 1 });
dutySchema.index({ shift: 1 });
