require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Shift = require('./models/Shift');
const Duty = require('./models/Duty');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Configuration constants
const DEFAULT_PASSWORD = 'TempPass123!'; // Should be changed after first login
const INITIAL_DATA = {
  users: [],
  patients: [],
  shifts: [],
  duties: []
};

const initDB = async () => {
  try {
    // Validate critical environment variables
    const requiredEnvVars = [
      'MONGODB_URL',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (!validator.isURL(process.env.MONGODB_URL)) {
      throw new Error('Invalid MongoDB URL format');
    }

    console.log('Connecting to MongoDB...');
    
    // Enhanced connection with timeout and retry
    await mongoose.connect(process.env.MONGODB_URL, {
      auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      },
      authSource: 'admin',
      connectTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data with collection checks
    console.log('Clearing existing data...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const clearOps = [
      { name: 'User', collection: 'users' },
      { name: 'Patient', collection: 'patients' },
      { name: 'Shift', collection: 'shifts' },
      { name: 'Duty', collection: 'duties' }
    ].map(async ({ name, collection }) => {
      if (collectionNames.includes(collection)) {
        await mongoose.model(name).deleteMany({});
        console.log(`✓ Cleared ${collection} collection`);
      }
    });

    await Promise.all(clearOps);

    // Create admin user with enhanced validation
    console.log('Creating admin user...');
    INITIAL_DATA.users.push(await User.create({
      username: 'admin',
      email: 'admin@hospital.com',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 12),
      role: 'admin',
      firstName: 'Hospital',
      lastName: 'Admin',
      licenseNumber: 'ADMIN-001',
      isActive: true
    }));

    // Create head nurse
    console.log('Creating head nurse...');
    INITIAL_DATA.users.push(await User.create({
      username: 'headnurse',
      email: 'head.nurse@hospital.com',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 12),
      role: 'head_nurse',
      firstName: 'Sarah',
      lastName: 'Johnson',
      licenseNumber: 'RN-1001',
      specialization: 'ICU',
      isActive: true
    }));

    // Create nursing staff
    console.log('Creating nursing staff...');
    const nurses = await User.insertMany([
      {
        username: 'nurse1',
        email: 'nurse1@hospital.com',
        password: await bcrypt.hash(DEFAULT_PASSWORD, 12),
        role: 'nurse',
        firstName: 'Emily',
        lastName: 'Davis',
        licenseNumber: 'RN-1002',
        specialization: 'Pediatrics',
        isActive: true
      },
      {
        username: 'nurse2',
        email: 'nurse2@hospital.com',
        password: await bcrypt.hash(DEFAULT_PASSWORD, 12),
        role: 'nurse',
        firstName: 'Michael',
        lastName: 'Brown',
        licenseNumber: 'RN-1003',
        specialization: 'ER',
        isActive: true
      }
    ]);
    INITIAL_DATA.users.push(...nurses);

    // Create patients with realistic medical data
    console.log('Creating patient records...');
    const patients = await Patient.insertMany([
      {
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: new Date(1980, 5, 15),
        gender: 'male',
        medicalRecordNumber: 'MRN-1001',
        roomNumber: '101A',
        primaryDiagnosis: 'Community-acquired pneumonia',
        secondaryDiagnoses: ['Hypertension', 'Type 2 Diabetes'],
        allergies: [{
          name: 'Penicillin',
          severity: 'severe',
          reaction: 'Anaphylaxis'
        }],
        status: 'admitted',
        admissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        firstName: 'Mary',
        lastName: 'Williams',
        dateOfBirth: new Date(1975, 8, 22),
        gender: 'female',
        medicalRecordNumber: 'MRN-1002',
        roomNumber: '205B',
        primaryDiagnosis: 'Femur fracture (right)',
        medications: [
          {
            name: 'Acetaminophen',
            dosage: '500mg',
            frequency: 'Every 6 hours',
            route: 'oral',
            prescribedBy: 'Dr. Anderson',
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ],
        status: 'admitted',
        admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ]);
    INITIAL_DATA.patients.push(...patients);

    // Create shifts with realistic time ranges
    console.log('Creating shift schedules...');
    const now = new Date();
    const shifts = await Shift.insertMany([
      {
        name: 'Morning Shift',
        description: '7am to 3pm nursing shift',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0),
        requiredStaff: 2,
        assignedNurses: [nurses[0]._id, nurses[1]._id],
        ward: 'Pediatrics',
        status: 'scheduled',
        createdBy: INITIAL_DATA.users[0]._id // Admin created
      },
      {
        name: 'Night Shift',
        description: '11pm to 7am emergency coverage',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 7, 0, 0),
        requiredStaff: 1,
        assignedNurses: [nurses[1]._id],
        ward: 'ER',
        status: 'scheduled',
        createdBy: INITIAL_DATA.users[1]._id // Head nurse created
      }
    ]);
    INITIAL_DATA.shifts.push(...shifts);

    // Create duties with detailed tasks
    console.log('Assigning duties...');
    const duties = await Duty.insertMany([
      {
        nurse: nurses[0]._id,
        patient: patients[0]._id,
        shift: shifts[0]._id,
        tasks: [
          {
            description: 'Administer morning medications',
            priority: 'high',
            notes: 'Check for penicillin allergy before administering antibiotics'
          },
          {
            description: 'Monitor vital signs',
            priority: 'high',
            notes: 'Watch for fever spikes'
          },
          {
            description: 'Assist with morning hygiene',
            priority: 'medium'
          }
        ],
        status: 'pending',
        createdBy: INITIAL_DATA.users[0]._id
      },
      {
        nurse: nurses[1]._id,
        patient: patients[1]._id,
        shift: shifts[0]._id,
        tasks: [
          {
            description: 'Assist with physical therapy session',
            priority: 'high',
            notes: 'Patient has limited mobility on right side'
          },
          {
            description: 'Monitor pain levels',
            priority: 'medium',
            notes: 'Medicate as needed per orders'
          }
        ],
        status: 'pending',
        createdBy: INITIAL_DATA.users[1]._id
      }
    ]);
    INITIAL_DATA.duties.push(...duties);

    // Success output
    console.log('\n✓ Database initialized successfully!');
    console.log('====================================');
    console.log('Initial Credentials (change immediately):');
    console.log('Admin:');
    console.log(`Username: admin / Password: ${DEFAULT_PASSWORD}`);
    console.log('Head Nurse:');
    console.log(`Username: headnurse / Password: ${DEFAULT_PASSWORD}`);
    console.log('Regular Nurses:');
    console.log(`Username: nurse1 / Password: ${DEFAULT_PASSWORD}`);
    console.log(`Username: nurse2 / Password: ${DEFAULT_PASSWORD}`);
    console.log('====================================');
    
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Error initializing database:');
    console.error(err.stack);
    
    // Attempt to clean up on failure
    try {
      await mongoose.connection.close();
    } catch (e) {
      console.error('Failed to close MongoDB connection:', e.message);
    }
    
    process.exit(1);
  }
};

// Handle promise rejections
process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err.stack);
  process.exit(1);
});

initDB();