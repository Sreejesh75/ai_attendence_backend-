const Worker = require('../models/Worker');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.registerWorker = async (req, res) => {
  try {
    const { name, faceData, jobRole, place, contactNumber, dailyWage } = req.body;

    if (!name || !req.file || !jobRole || !place || !contactNumber || !dailyWage) {
      return res.status(400).json({ message: 'All required fields (name, photo, jobRole, place, contactNumber, dailyWage) must be provided' });
    }

    // Upload the file buffer to Cloudinary string via memory stream
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'attendance_workers' },
          (error, result) => {
            if (result) resolve(result.secure_url);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const photoUrl = await uploadToCloudinary(req.file.buffer);

    const newWorker = new Worker({
      name,
      photoUrl,
      faceData, // optional payload for AI models / embeddings
      jobRole,
      place,
      contactNumber,
      dailyWage
    });

    await newWorker.save();
    res.status(201).json({ message: 'Worker registered successfully', worker: newWorker });
  } catch (error) {
    res.status(500).json({ message: 'Error registering worker', error: error.message });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Error formatting workers', error: error.message });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Error finding worker', error: error.message });
  }
};
