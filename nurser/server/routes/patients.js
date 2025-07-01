const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const authMiddleware = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management
 */

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [admitted, discharged, transferred, critical]
 *         description: Filter by patient status
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward/room prefix (e.g., '2' for 2nd floor)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name or MRN
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, ward, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (ward) filter.roomNumber = new RegExp(`^${ward}`, 'i');
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { medicalRecordNumber: searchRegex }
      ];
    }

    const patients = await Patient.find(filter)
      .sort({ lastName: 1, firstName: 1 });

    res.json(patients);
  } catch (err) {
    logger.error(`Error fetching patients: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get a single patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    logger.error(`Error fetching patient ${req.params.id}: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Created patient
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', 
  authMiddleware,
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('dateOfBirth', 'Valid date of birth is required').isISO8601(),
    check('gender', 'Valid gender is required').isIn(['male', 'female', 'other']),
    check('medicalRecordNumber', 'Medical record number is required').not().isEmpty(),
    check('roomNumber', 'Room number is required').not().isEmpty(),
    check('primaryDiagnosis', 'Primary diagnosis is required').not().isEmpty(),
    check('status', 'Valid status is required').isIn(['admitted', 'discharged', 'transferred', 'critical'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const patientData = req.body;
      
      // Set admission date if not provided
      if (!patientData.admissionDate) {
        patientData.admissionDate = new Date();
      }

      const patient = new Patient(patientData);
      await patient.save();
      
      logger.info(`New patient created by ${req.user.username}: ${patient._id}`);
      res.status(201).json(patient);
    } catch (err) {
      logger.error(`Error creating patient: ${err.message}`);
      
      // Handle duplicate MRN error
      if (err.code === 11000 && err.keyPattern.medicalRecordNumber) {
        return res.status(400).json({ message: 'Medical record number must be unique' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @swagger
 * /patients/{id}/medications:
 *   post:
 *     summary: Add medication to patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medication:
 *                 $ref: '#/components/schemas/Medication'
 *     responses:
 *       200:
 *         description: Updated patient with new medication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.post('/:id/medications', 
  authMiddleware,
  [
    check('medication.name', 'Medication name is required').not().isEmpty(),
    check('medication.dosage', 'Dosage is required').not().isEmpty(),
    check('medication.frequency', 'Frequency is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      patient.medications.push(req.body.medication);
      await patient.save();
      
      logger.info(`Medication added to patient ${patient._id} by ${req.user.username}`);
      res.json(patient);
    } catch (err) {
      logger.error(`Error adding medication: ${err.message}`);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Update patient information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Updated patient
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Prevent updating certain fields
    const allowedUpdates = [
      'roomNumber', 
      'primaryDiagnosis',
      'secondaryDiagnoses',
      'allergies',
      'status',
      'dischargeDate',
      'specialNeeds'
    ];
    
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if (!isValidUpdate) {
      return res.status(400).json({ message: 'Invalid updates attempted' });
    }

    // Handle discharge date validation
    if (req.body.status === 'discharged' && !req.body.dischargeDate) {
      req.body.dischargeDate = new Date();
    }

    updates.forEach(update => patient[update] = req.body[update]);
    await patient.save();
    
    logger.info(`Patient ${patient._id} updated by ${req.user.username}`);
    res.json(patient);
  } catch (err) {
    logger.error(`Error updating patient: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete a patient (restricted to admin)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       204:
 *         description: Patient deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin)
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admins can delete patients
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete patients' });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    logger.info(`Patient ${patient._id} deleted by ${req.user.username}`);
    res.status(204).end();
  } catch (err) {
    logger.error(`Error deleting patient: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;