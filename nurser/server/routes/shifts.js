import express from 'express';
import Shift from '../models/Shift.js';
import authMiddleware from '../middleware/auth.js';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management
 */

// Get all shifts
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

    if (req.user.role !== 'admin') {
      filter.assignedNurses = req.user._id;
    }

    const shifts = await Shift.find(filter)
      .populate('assignedNurses', 'firstName lastName licenseNumber')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTime: 1 });

    res.json(shifts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single shift
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid shift ID' });
    }

    const shift = await Shift.findById(req.params.id)
      .populate('assignedNurses', 'firstName lastName licenseNumber')
      .populate('createdBy', 'firstName lastName');

    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (req.user.role !== 'admin' && 
        !shift.assignedNurses.some(nurse => nurse._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view this shift' });
    }

    res.json(shift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new shift
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

    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create shifts' });
    }

    try {
      const { name, description, startTime, endTime, requiredStaff, ward } = req.body;

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
      res.status(201).json(shift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Assign nurses to shift
router.patch('/:id/assign', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to assign nurses' });
    }

    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const { nurseIds } = req.body;
    if (!Array.isArray(nurseIds)) {
      return res.status(400).json({ message: 'nurseIds must be an array' });
    }

    const validNurseIds = nurseIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    shift.assignedNurses = [...new Set(validNurseIds)];
    await shift.save();
    
    const populatedShift = await Shift.findById(shift._id)
      .populate('assignedNurses', 'firstName lastName licenseNumber');
    
    res.json(populatedShift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shift
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'head_nurse'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update shifts' });
    }

    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

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
    
    res.json(populatedShift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shift
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete shifts' });
    }

    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;