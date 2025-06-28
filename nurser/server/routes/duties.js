const express = require('express');
const router = express.Router();
const Duty = require('../models/Duty');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Duties
 *   description: Nurse duties management
 */

/**
 * @swagger
 * /duties:
 *   get:
 *     summary: Get all duties
 *     tags: [Duties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of duties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Duty'
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const duties = await Duty.find()
      .populate('nurse', 'username displayName')
      .populate('patient', 'name roomNumber')
      .populate('shift', 'name startTime endTime');
    res.json(duties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /duties/{id}:
 *   get:
 *     summary: Get a specific duty
 *     tags: [Duties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Duty details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Duty'
 *       404:
 *         description: Duty not found
 */
router.get('/:id', authMiddleware, getDuty, (req, res) => {
  res.json(res.duty);
});

/**
 * @swagger
 * /duties:
 *   post:
 *     summary: Create a new duty
 *     tags: [Duties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Duty'
 *     responses:
 *       201:
 *         description: Created duty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Duty'
 *       400:
 *         description: Bad request
 */
router.post('/', authMiddleware, async (req, res) => {
  const duty = new Duty({
    nurse: req.body.nurse,
    patient: req.body.patient,
    shift: req.body.shift,
    tasks: req.body.tasks || [],
    notes: req.body.notes || '',
    status: req.body.status || 'pending'
  });

  try {
    const newDuty = await duty.save();
    res.status(201).json(newDuty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Middleware to get duty by ID
async function getDuty(req, res, next) {
  let duty;
  try {
    duty = await Duty.findById(req.params.id)
      .populate('nurse', 'username displayName')
      .populate('patient', 'name roomNumber')
      .populate('shift', 'name startTime endTime');
    if (duty == null) {
      return res.status(404).json({ message: 'Cannot find duty' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.duty = duty;
  next();
}

module.exports = router;