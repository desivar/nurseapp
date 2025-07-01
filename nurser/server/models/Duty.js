// server/models/Duty.js
import mongoose from 'mongoose';

const emsSchema = new mongoose.Schema({
  // Incident details
  incidentType: {
    type: String,
    enum: ['medical_emergency', 'trauma', 'interfacility_transfer', 'other'],
    default: 'medical_emergency',
    required: [true, 'An EMS record must have an incident type']
  },
  incidentDateTime: {
    type: Date,
    default: Date.now,
    required: [true, 'Incident must have a date and time']
  },
  location: {
    type: String,
    required: [true, 'Incident location is required']
  },
  // Patient details
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient', // Assuming you have a Patient model
    required: [true, 'An EMS record must be associated with a patient']
  },
  // Personnel involved
  responders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming 'User' model includes paramedics, EMTs, etc.
    required: [true, 'An EMS record must have at least one responder']
  }],
  // Shift (if relevant)
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift', // Assuming you have a Shift model
  },
  // Actions/Interventions
  interventions: [{
    description: {
      type: String,
      required: [true, 'Intervention must have a description']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateTime: {
      type: Date,
      default: Date.now
    },
    outcome: String,
    notes: String,
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'critical'],
      default: 'urgent'
    }
  }],
  // Status of the EMS incident
  status: {
    type: String,
    enum: ['dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'completed', 'cancelled'],
    default: 'dispatched'
  },
  // Times for tracking incident phases
  dispatchTime: Date,
  enRouteTime: Date,
  onSceneTime: Date,
  transportStartTime: Date,
  atHospitalTime: Date,
  completedTime: Date,
  // Outcome of the incident
  outcome: {
    type: String,
    enum: ['transported', 'treated_on_scene', 'refused_care', 'no_patient_found', 'other'],
    required: [true, 'Outcome of the EMS incident is required']
  },
  notes: String, // General notes about the incident
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property for total incident duration
emsSchema.virtual('incidentDuration').get(function() {
  if (this.incidentDateTime && this.completedTime) {
    return (this.completedTime - this.incidentDateTime) / (1000 * 60); // Duration in minutes
  }
  return null;
});

// Update timestamp before saving
emsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/*******************************
 * INDEXES             *
 *******************************/
emsSchema.index({ incidentType: 1, status: 1 });
emsSchema.index({ patient: 1 });
emsSchema.index({ 'responders': 1 });
emsSchema.index({ incidentDateTime: -1 });

export default mongoose.model('EMS', emsSchema);