const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  photoUrl: {
    type: String,
    required: true, // For admin saving the photo
  },
  faceData: {
    type: String,
    // Optional: Can store face recognition descriptors from AI
  },
  jobRole: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  dailyWage: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Worker', WorkerSchema);
