import mongoose from 'mongoose'; // ✅ Changed from require()

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Patient must have a first name']
  },
  lastName: {
    type: String,
    required: [true, 'Patient must have a last name']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Patient must have a date of birth']
  },
  gender: {  // ✅ Fixed formatting (added missing comma after previous field)
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  medicalRecordNumber: {
    type: String,
    unique: true,
    required: [true, 'Patient must have a medical record number']
  },
  roomNumber: {
    type: String,
    required: [true, 'Patient must be assigned a room']
  },
  admissionDate: {
    type: Date,
    required: [true, 'Patient must have an admission date'],
    default: Date.now
  },
  primaryDiagnosis: {
    type: String,
    required: [true, 'Patient must have a primary diagnosis']
  },
  secondaryDiagnoses: [String],
  allergies: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],  // ✅ Fixed indentation
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    route: String,
    prescribedBy: String
  }],
  specialNeeds: [String],
  status: {
    type: String,
    enum: ['admitted', 'discharged', 'transferred', 'critical'],
    default: 'admitted'
  },
  dischargeDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Virtual for patient's age
patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Update timestamp before saving
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/*******************************
 * INDEXES            *
 *******************************/
patientSchema.index({ medicalRecordNumber: 1 });  // ✅ Fixed typo ("pientSchema" → "patientSchema")
patientSchema.index({ lastName: 1, firstName: 1 });
patientSchema.index({ status: 1, roomNumber: 1 });

// ✅ Correct ES Module export (NO module.exports)
const Patient = mongoose.model('Patient', patientSchema);
export default Patient;