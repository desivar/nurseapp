const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
  nurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A duty must be assigned to a nurse'],
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'A duty must be assigned to a patient'],
    index: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'A duty must be assigned to a shift'],
    index: true
  },
  tasks: [{
    description: {
      type: String,
      required: [true, 'Task must have a description'],
      trim: true,
      maxlength: [500, 'Task description cannot exceed 500 characters']
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      validate: {
        validator: function(v) {
          // completedAt can only exist if task is completed
          return !v || this.isCompleted;
        },
        message: 'Cannot set completedAt for incomplete task'
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Task notes cannot exceed 1000 characters']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    _id: false // Prevent automatic ID generation for subdocuments
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'Duty must have a start time'],
    validate: {
      validator: function(v) {
        // Start time must be before end time
        return !this.endTime || v < this.endTime;
      },
      message: 'Start time must be before end time'
    }
  },
  endTime: {
    type: Date,
    required: [true, 'Duty must have an end time'],
    validate: {
      validator: function(v) {
        // End time must be after start time
        return !this.startTime || v > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Duty notes cannot exceed 2000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true, // Auto-manage createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Remove version key
      ret.id = ret._id; // Map _id to id
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Duration virtual (in hours)
dutySchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60);
});

// Compound indexes for common query patterns
dutySchema.index({ nurse: 1, startTime: 1 });
dutySchema.index({ patient: 1, status: 1 });
dutySchema.index({ 
  status: 1, 
  startTime: 1, 
  endTime: 1 
});

// Query middleware for soft delete support
dutySchema.pre(/^find/, function(next) {
  // Exclude cancelled duties by default
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'cancelled' } });
  }
  next();
});

module.exports = mongoose.model('Duty', dutySchema);