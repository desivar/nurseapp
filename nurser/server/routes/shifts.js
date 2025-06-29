// C:\Users\jilli\nurseapp\nurser\server\routes\shifts.js
const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift'); // Import your Shift model

// You'll want to add actual routes here later, e.g.:
// router.get('/', async (req, res) => { /* get all shifts logic */ });
// router.post('/', async (req, res) => { /* create new shift logic */ });
// etc.

// For now, let's just add a placeholder route to make sure it works
router.get('/', (req, res) => {
  res.status(200).json({ message: "Shifts route works!" });
});

module.exports = router;