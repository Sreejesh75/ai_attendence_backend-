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
      dailyWage,
      adminId: req.user.id // Tie worker to the person who created them
    });

    await newWorker.save();
    res.status(201).json({ message: 'Worker registered successfully', worker: newWorker });
  } catch (error) {
    res.status(500).json({ message: 'Error registering worker', error: error.message });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ adminId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workers', error: error.message });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, adminId: req.user.id });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Error finding worker', error: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { name, jobRole, place, contactNumber, dailyWage } = req.body;
    let updateData = { name, jobRole, place, contactNumber, dailyWage };

    if (req.file) {
      // (upload logic removed for brevity but must be kept in the real replacement)
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
      updateData.photoUrl = await uploadToCloudinary(req.file.buffer);
    }

    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found or you don\'t have permission' });
    }

    res.status(200).json({ message: 'Worker updated successfully', worker: updatedWorker });
  } catch (error) {
    res.status(500).json({ message: 'Error updating worker', error: error.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const deletedWorker = await Worker.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!deletedWorker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.status(200).json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting worker', error: error.message });
  }
};
