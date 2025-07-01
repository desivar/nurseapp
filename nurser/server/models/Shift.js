import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shift must have a name'],
    unique: true,
    trim: true
  },
  description: String,
  startTime: {
    type: Date,
    required: [true, 'Shift must have a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Shift must have an end time']
  },
  requiredStaff: {
    type: Number,
    required: [true, 'Shift must specify required staff count'],
    min: [1, 'Staff count must be at least 1']
  },
  assignedNurses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  ward: {
    type: String,
    enum: ['ER', 'ICU', 'Pediatrics', 'Maternity', 'General', 'Surgery', 'Cardiology'],
    required: [true, 'Shift must be assigned to a ward']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for shift duration in hours
shiftSchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60); // Hours
});

// Check if shift has enough staff
shiftSchema.virtual('isFullyStaffed').get(function() {
  return this.assignedNurses.length >= this.requiredStaff;
});

// Update timestamp before saving
shiftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/*******************************
 *         INDEXES             *
 *******************************/
shiftSchema.index({ startTime: 1, endTime: 1 });
shiftSchema.index({ ward: 1, status: 1 });

// Modern export
const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;