const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shift must have a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Shift name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s\-]+$/, 'Shift name can only contain letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Shift must have a start time'],
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
    required: [true, 'Shift must have an end time'],
    validate: {
      validator: function(v) {
        // End time must be after start time
        return !this.startTime || v > this.startTime;
        // Minimum shift duration of 1 hour
        return (v - this.startTime) >= (60 * 60 * 1000);
      },
      message: props => {
        if (props.value <= this.startTime) {
          return 'End time must be after start time';
        }
        return 'Minimum shift duration is 1 hour';
      }
    }
  },
  requiredStaff: {
    type: Number,
    required: [true, 'Shift must specify required staff count'],
    min: [1, 'Staff count must be at least 1'],
    max: [20, 'Staff count cannot exceed 20']
  },
  assignedNurses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(v) {
        // Prevent duplicate nurse assignments
        return v.length === new Set(v.map(id => id.toString())).size;
      },
      message: 'Cannot assign the same nurse multiple times to one shift'
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'pending_approval'],
    default: 'scheduled',
    index: true
  },
  ward: {
    type: String,
    enum: ['ER', 'ICU', 'Pediatrics', 'Maternity', 'General', 'Surgery', 'Cardiology', 'Oncology', 'Neurology'],
    required: [true, 'Shift must be assigned to a ward'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Virtual for shift duration in hours
shiftSchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60);
});

// Check if shift has enough staff
shiftSchema.virtual('isFullyStaffed').get(function() {
  return this.assignedNurses.length >= this.requiredStaff;
});

// Virtual for current shift status (active/inactive)
shiftSchema.virtual('isActive').get(function() {
  const now = new Date();
  return (
    this.status === 'in_progress' ||
    (this.status === 'scheduled' && 
     this.startTime <= now && 
     this.endTime >= now)
  );
});

// Compound indexes for optimized queries
shiftSchema.index({ startTime: 1, endTime: 1 });
shiftSchema.index({ ward: 1, status: 1 });
shiftSchema.index({ status: 1, isFullyStaffed: 1 });
shiftSchema.index({ 'assignedNurses': 1, startTime: 1 });

// Pre-save validation
shiftSchema.pre('save', function(next) {
  // Auto-update status based on time
  const now = new Date();
  if (this.isModified('startTime') || this.isModified('endTime')) {
    if (now > this.endTime && this.status === 'in_progress') {
      this.status = 'completed';
    } else if (now >= this.startTime && now <= this.endTime && this.status === 'scheduled') {
      this.status = 'in_progress';
    }
  }
  
  // Validate nurse assignments don't conflict with other shifts
  if (this.isModified('assignedNurses')) {
    // Would implement actual overlap checking here
  }
  
  next();
});

// Query middleware to exclude cancelled shifts by default
shiftSchema.pre(/^find/, function(next) {
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'cancelled' } });
  }
  next();
});

module.exports = mongoose.model('Shift', shiftSchema);