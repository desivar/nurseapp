const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String, select: false }, // For local auth
  githubId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['admin', 'nurse'], default: 'nurse' },
  name: String,
  authMethod: { type: String, enum: ['local', 'github'], required: true }
});

// Add to bottom (if not exists):
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);