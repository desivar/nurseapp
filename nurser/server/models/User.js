const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    sparse: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['nurse', 'admin', 'head_nurse'],
      message: '{VALUE} is not a valid role'
    },
    default: 'nurse'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    enum: ['ER', 'OR', 'Pediatrics', 'ICU', 'General', 'Cardiology', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
userSchema.methods.verifyPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/*******************************
 *         INDEXES             *
 *******************************/
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
//userSchema.index({ githubId: 1 }, { unique: true, sparse: true });
userSchema.index({ firstName: 1, lastName: 1 }); // For name searches

module.exports = mongoose.model('User', userSchema);