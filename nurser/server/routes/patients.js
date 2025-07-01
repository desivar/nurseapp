import express from 'express';
import Patient from '../models/Patient.js';

const router = express.Router();

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
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get a specific patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getPatient, (req, res) => {
  res.json(res.patient);
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  const patient = new Patient({
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    roomNumber: req.body.roomNumber,
    diagnosis: req.body.diagnosis || '',
    admissionDate: req.body.admissionDate || Date.now(),
    status: req.body.status || 'active'
  });

  try {
    const newPatient = await patient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Update a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Bad request
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', getPatient, async (req, res) => {
  if (req.body.name != null) {
    res.patient.name = req.body.name;
  }
  if (req.body.age != null) {
    res.patient.age = req.body.age;
  }
  // Add other fields similarly...

  try {
    const updatedPatient = await res.patient.save();
    res.json(updatedPatient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient deleted
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', getPatient, async (req, res) => {
  try {
    await res.patient.remove();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get patient by ID
async function getPatient(req, res, next) {
  let patient;
  try {
    patient = await Patient.findById(req.params.id);
    if (patient == null) {
      return res.status(404).json({ message: 'Cannot find patient' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.patient = patient;
  next();
}

export default router;