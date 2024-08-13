const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/trailcamapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  name: String,
  email: String,
  photos: Array,
  gps_pins: Array,
  uploads: Array,
  scan_history: Array,
  profile_picture_url: String,
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  connectDB,
  User,
};
