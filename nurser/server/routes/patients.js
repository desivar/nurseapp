// C:\Users\jilli\nurseapp\nurser\server\routes\patients.js
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient'); // Import your Patient model

// A placeholder route for now. You'll add your actual patient CRUD operations here later.
router.get('/', (req, res) => {
  res.status(200).json({ message: "Patients route works!" });
});

module.exports = router;