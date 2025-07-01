import express from 'express';
import Duty from '../models/Duty.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Error handler utility
const handleError = (res, status = 500, message = 'Server error') => {
  res.status(status).json({ message });
};

// Validation middleware
const validateDutyInput = (req, res, next) => {
  if (!req.body.nurse || !req.body.patient || !req.body.shift) {
    return handleError(res, 400, 'Missing required fields: nurse, patient, shift');
  }
  next();
};

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
 *     summary: Get all duties (paginated)
 *     tags: [Duties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of duties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Duty'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const [duties, total] = await Promise.all([
      Duty.find()
        .limit(limit)
        .skip(skip)
        .populate('nurse', 'username displayName')
        .populate('patient', 'name roomNumber')
        .populate('shift', 'name startTime endTime'),
      Duty.countDocuments()
    ]);

    res.json({
      data: duties,
      pagination: {
        currentPage: +page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    handleError(res, 500, err.message);
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
 *         description: Validation error
 */
router.post('/', authMiddleware, validateDutyInput, async (req, res) => {
  try {
    const duty = new Duty({
      nurse: req.body.nurse,
      patient: req.body.patient,
      shift: req.body.shift,
      tasks: req.body.tasks || [],
      notes: req.body.notes || '',
      status: req.body.status || 'pending'
    });

    const newDuty = await duty.save();
    res.status(201).json(newDuty);
  } catch (err) {
    handleError(res, 400, err.message);
  }
});

/**
 * @swagger
 * /duties/{id}:
 *   patch:
 *     summary: Update a duty
 *     tags: [Duties]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/Duty'
 *     responses:
 *       200:
 *         description: Updated duty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Duty'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Duty not found
 */
router.patch('/:id', authMiddleware, getDuty, validateDutyInput, async (req, res) => {
  try {
    const updatableFields = ['nurse', 'patient', 'shift', 'tasks', 'notes', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        res.duty[field] = req.body[field];
      }
    });

    const updatedDuty = await res.duty.save();
    res.json(updatedDuty);
  } catch (err) {
    handleError(res, 400, err.message);
  }
});

/**
 * @swagger
 * /duties/{id}:
 *   delete:
 *     summary: Delete a duty
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
 *       204:
 *         description: Duty deleted
 *       404:
 *         description: Duty not found
 */
router.delete('/:id', authMiddleware, getDuty, async (req, res) => {
  try {
    await res.duty.deleteOne();
    res.status(204).end();
  } catch (err) {
    handleError(res, 500, err.message);
  }
});

// Middleware to get duty by ID
async function getDuty(req, res, next) {
  try {
    const duty = await Duty.findById(req.params.id)
      .populate('nurse', 'username displayName')
      .populate('patient', 'name roomNumber')
      .populate('shift', 'name startTime endTime');
      
    if (!duty) {
      return handleError(res, 404, 'Duty not found');
    }
    
    res.duty = duty;
    next();
  } catch (err) {
    handleError(res, 500, err.message);
  }
}

export default router;