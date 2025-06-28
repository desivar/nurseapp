require('dotenv').config(); // This must be at the very top

const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Shift = require('./models/Shift');
const Duty = require('./models/Duty');
const bcrypt = require('bcryptjs');

const initDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI:
    console.log('Connected to MongoDB');

    // Clear existing data
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped existing database');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'admin',
      firstName: 'Hospital',
      lastName: 'Admin',
      licenseNumber: 'ADMIN-001'
    });

    // Create head nurse
    const headNursePassword = await bcrypt.hash('nurse123', 12);
    const headNurse = await User.create({
      username: 'headnurse',
      email: 'head.nurse@hospital.com',
      password: headNursePassword,
      role: 'head_nurse',
      firstName: 'Sarah',
      lastName: 'Johnson',
      licenseNumber: 'RN-1001',
      specialization: 'ICU'
    });

    // Create regular nurses
    const nurses = await User.create([
      {
        username: 'nurse1',
        email: 'nurse1@hospital.com',
        password: await bcrypt.hash('nurse123', 12),
        role: 'nurse',
        firstName: 'Emily',
        lastName: 'Davis',
        licenseNumber: 'RN-1002',
        specialization: 'Pediatrics'
      },
      {
        username: 'nurse2',
        email: 'nurse2@hospital.com',
        password: await bcrypt.hash('nurse123', 12),
        role: 'nurse',
        firstName: 'Michael',
        lastName: 'Brown',
        licenseNumber: 'RN-1003',
        specialization: 'ER'
      }
    ]);

    // Create patients
    const patients = await Patient.create([
      {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date(1980, 5, 15),
        gender: 'male',
        medicalRecordNumber: 'MRN-1001',
        roomNumber: '101A',
        primaryDiagnosis: 'Pneumonia',
        allergies: [{ name: 'Penicillin', severity: 'severe' }],
        status: 'admitted'
      },
      {
        firstName: 'Mary',
        lastName: 'Williams',
        dateOfBirth: new Date(1975, 8, 22),
        gender: 'female',
        medicalRecordNumber: 'MRN-1002',
        roomNumber: '205B',
        primaryDiagnosis: 'Fractured femur',
        medications: [
          {
            name: 'Acetaminophen',
            dosage: '500mg',
            frequency: 'Every 6 hours',
            route: 'oral',
            prescribedBy: 'Dr. Anderson'
          }
        ],
        status: 'admitted'
      }
    ]);

    // Create shifts
    const now = new Date();
    const shifts = await Shift.create([
      {
        name: 'Morning Shift',
        description: '7am to 3pm shift',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0),
        requiredStaff: 2,
        assignedNurses: [nurses[0]._id, nurses[1]._id],
        ward: 'Pediatrics',
        status: 'scheduled'
      },
      {
        name: 'Night Shift',
        description: '11pm to 7am shift',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 7, 0, 0),
        requiredStaff: 1,
        assignedNurses: [nurses[1]._id],
        ward: 'ER',
        status: 'scheduled'
      }
    ]);

    // Create duties
    await Duty.create([
      {
        nurse: nurses[0]._id,
        patient: patients[0]._id,
        shift: shifts[0]._id,
        tasks: [
          {
            description: 'Administer morning medication',
            priority: 'high'
          },
          {
            description: 'Check vitals',
            priority: 'medium'
          }
        ],
        startTime: shifts[0].startTime,
        endTime: shifts[0].endTime,
        status: 'pending'
      },
      {
        nurse: nurses[1]._id,
        patient: patients[1]._id,
        shift: shifts[0]._id,
        tasks: [
          {
            description: 'Assist with physical therapy',
            priority: 'medium'
          }
        ],
        startTime: shifts[0].startTime,
        endTime: shifts[0].endTime,
        status: 'pending'
      }
    ]);

    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

initDB();