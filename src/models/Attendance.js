const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
  },
  date: {
    type: String, // Format YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // Format HH:mm:ss
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

// A worker can only have one attendance record per day
AttendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
