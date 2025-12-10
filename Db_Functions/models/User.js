const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  class: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  attendance: { type: String, required: true },
  email: { type: String, required: false, lowercase: true, trim: true },
  password: { type: String, required: false },
}, { timestamps: true });

// Hash password if present before saving employee record
userSchema.pre('save', async function() {
  if (!this.isModified || !this.isModified('password')) return;
  if (!this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.index({ name: 1 });
userSchema.index({ class: 1 });
userSchema.index({ subject: 1 });

module.exports = mongoose.model('User', userSchema, 'users');
