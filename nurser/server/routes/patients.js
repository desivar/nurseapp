// C:\Users\jilli\nurseapp\nurser\server\routes\patients.js
import express from 'express';

import Patient from '../models/Patient.js'; // Import your Patient model
const router = express.Router();

// A placeholder route for now. You'll add your actual patient CRUD operations here later.
router.get('/', (req, res) => {
  res.status(200).json({ message: "Patients route works!" });
});

export default router;