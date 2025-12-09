const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://engrhassan37_db_user:FgbY0K7xOJH0wRCE@testing.z164fxc.mongodb.net/test_project';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectDB, mongoose };
