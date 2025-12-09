const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const accountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
accountSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords during login
accountSchema.methods.comparePassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

accountSchema.index({ username: 1 });
accountSchema.index({ email: 1 });

module.exports = mongoose.model('Account', accountSchema, 'accounts');
