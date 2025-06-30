const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    sparse: true,
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: function() {
      // Password not required for GitHub-authenticated users
      return !this.githubId;
    },
    select: false,
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Require at least one number and one letter
        return /[A-Za-z]/.test(v) && /[0-9]/.test(v);
      },
      message: 'Password must contain at least one letter and one number'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['nurse', 'admin', 'head_nurse', 'supervisor'],
      message: '{VALUE} is not a valid role'
    },
    default: 'nurse',
    index: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\u00C0-\u017F\s'-]+$/, 'Please enter a valid first name']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\u00C0-\u017F\s'-]+$/, 'Please enter a valid last name']
  },
  licenseNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional
        return /^[A-Z]{2,3}-\d{4,6}$/.test(v);
      },
      message: 'License number must be in format like RN-12345 or LPN-123456'
    }
  },
  specialization: {
    type: String,
    enum: ['ER', 'OR', 'Pediatrics', 'ICU', 'General', 'Cardiology', 'Oncology', 'Neurology', null],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.password;
      delete ret.twoFactorSecret;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Ensure token created after
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
userSchema.methods.verifyPassword = async function(candidatePassword) {
  if (!this.password) return false; // For OAuth users
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ firstName: 'text', lastName: 'text' }); // For text search

// Query middleware to exclude inactive users by default
userSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isActive) {
    this.where({ isActive: true });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);