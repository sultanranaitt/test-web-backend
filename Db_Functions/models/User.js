const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  class: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  attendance: { type: String, required: true },
}, { timestamps: true });

userSchema.index({ name: 1 });
userSchema.index({ class: 1 });
userSchema.index({ subject: 1 });

module.exports = mongoose.model('User', userSchema, 'users');
