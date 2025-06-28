const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: Number,
  gender: String,
  medicalRecordNumber: {
    type: String,
    unique: true
  },
  roomNumber: String,
  admissionDate: Date,
  primaryDiagnosis: String,
  carePlan: String,
  allergies: [String],
  specialNeeds: String,
  status: {
    type: String,
    enum: ['admitted', 'discharged', 'transferred'],
    default: 'admitted'
  }
});

module.exports = mongoose.model('Patient', patientSchema);