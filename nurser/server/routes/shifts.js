const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const authMiddleware = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management
 */

/**
 * @swagger
 * /shifts:
 *   get:
 *     summary: Get all shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         description: Filter by shift status
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *           enum: [ER, ICU, Pediatrics, Maternity, General, Surgery, Cardiology]
 *         description: Filter by ward
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shift'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, ward, date } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (ward) filter.ward = ward;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.startTime = { $gte: startDate, $lt: endDate };
    }

    // For non-admin users, only show their assigned shifts
    if (req.user.role !== 'admin') {
      filter.assignedNurses = req.user._id;
    }

    const shifts = await Shift.find(filter)
      .populate('assignedNurses', 'firstName lastName licenseNumber')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTime: 1 });

    res.json(shifts);
  } catch (err) {
    logger.error(`Error fetching shifts: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /shifts/{id}:
 *   get:
 *     summary: Get a single shift by ID
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid shift ID' });
    }

    const shift = await Shift.findById(req.params.id)
      .populate('assignedNurses', 'firstName lastName licenseNumber')
      .populate('createdBy', 'firstName lastName');

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && 
        !shift.assignedNurses.some(nurse => nurse._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view this shift' });
    }

    res.json(shift);
  } catch (err) {
    logger.error(`Error fetching shift ${req.params.id}: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create a new shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shift'
 *     responses:
 *       201:
 *         description: Created shift
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin trying to create shift)
 *       500:
 *         description: Server error
 */
router.post('/', 
  authMiddleware,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('startTime', 'Valid start time is required').isISO8601(),
    check('endTime', 'Valid end time is required').isISO8601(),
    check('ward', 'Valid ward is required').isIn([
      'ER', 'ICU', 'Pediatrics', 'Maternity', 'General', 'Surgery', 'Cardiology'
    ]),
    check('requiredStaff', 'Required staff must be at least 1').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins and head nurses can create shifts
    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create shifts' });
    }

    try {
      const { name, description, startTime, endTime, requiredStaff, ward } = req.body;

      // Validate time range
      if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      const shift = new Shift({
        name,
        description,
        startTime,
        endTime,
        requiredStaff,
        ward,
        createdBy: req.user._id
      });

      await shift.save();
      
      logger.info(`New shift created by ${req.user.username}: ${shift._id}`);
      res.status(201).json(shift);
    } catch (err) {
      logger.error(`Error creating shift: ${err.message}`);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * @swagger
 * /shifts/{id}/assign:
 *   patch:
 *     summary: Assign nurses to a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nurseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of nurse IDs to assign
 *     responses:
 *       200:
 *         description: Updated shift
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin trying to assign nurses)
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/assign', authMiddleware, async (req, res) => {
  try {
    // Only admins and head nurses can assign nurses
    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to assign nurses' });
    }

    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Validate nurse IDs
    const { nurseIds } = req.body;
    if (!Array.isArray(nurseIds)) {
      return res.status(400).json({ message: 'nurseIds must be an array' });
    }

    const validNurseIds = nurseIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    shift.assignedNurses = [...new Set(validNurseIds)]; // Remove duplicates

    await shift.save();
    
    const populatedShift = await Shift.findById(shift._id)
      .populate('assignedNurses', 'firstName lastName licenseNumber');
    
    logger.info(`Shift ${shift._id} updated with new nurse assignments by ${req.user.username}`);
    res.json(populatedShift);
  } catch (err) {
    logger.error(`Error assigning nurses to shift: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /shifts/{id}:
 *   patch:
 *     summary: Update a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shift'
 *     responses:
 *       200:
 *         description: Updated shift
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin trying to update shift)
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admins and head nurses can update shifts
    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update shifts' });
    }

    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Prevent updating certain fields
    const allowedUpdates = ['name', 'description', 'status', 'ward'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if (!isValidUpdate) {
      return res.status(400).json({ message: 'Invalid updates attempted' });
    }

    updates.forEach(update => shift[update] = req.body[update]);
    await shift.save();
    
    const populatedShift = await Shift.findById(shift._id)
      .populate('assignedNurses', 'firstName lastName licenseNumber');
    
    logger.info(`Shift ${shift._id} updated by ${req.user.username}`);
    res.json(populatedShift);
  } catch (err) {
    logger.error(`Error updating shift: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /shifts/{id}:
 *   delete:
 *     summary: Delete a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       204:
 *         description: Shift deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (non-admin trying to delete shift)
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Only admins can delete shifts
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete shifts' });
    }

    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    logger.info(`Shift ${shift._id} deleted by ${req.user.username}`);
    res.status(204).end();
  } catch (err) {
    logger.error(`Error deleting shift: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;