const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const dayjs = require('dayjs');

exports.markAttendance = async (req, res) => {
  try {
    const { workerId } = req.body;
    
    if (!workerId) {
      return res.status(400).json({ message: 'workerId is required' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Standardize date and time (IST - UTC+5:30)
    const now = dayjs().utcOffset(330);
    const date = now.format('YYYY-MM-DD');
    const time = now.format('HH:mm:ss');

    // Check if attendance already marked for today
    const existingRecord = await Attendance.findOne({ workerId, date });
    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already marked for today', record: existingRecord });
    }

    const newAttendance = new Attendance({
      workerId,
      date,
      time
    });

    await newAttendance.save();
    
    res.status(201).json({
      message: 'Attendance marked successfully via AI detection',
      record: newAttendance,
      workerName: worker.name
    });

  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query; // format YYYY-MM-DD
    const targetDate = date || dayjs().utcOffset(330).format('YYYY-MM-DD');

    // Get all workers
    const allWorkers = await Worker.find();
    
    // Get attendance records for the target date and filter out null workers (case where worker was deleted)
    const rawRecords = await Attendance.find({ date: targetDate }).populate('workerId', 'name photoUrl');
    const attendanceRecords = rawRecords.filter(record => record.workerId !== null);

    const presentWorkerIds = attendanceRecords.map(record => record.workerId._id.toString());

    // Calculate present and absent details
    const presentCount = presentWorkerIds.length;
    let absentCount = 0;
    
    const reportData = allWorkers.map(worker => {
      const isPresent = presentWorkerIds.includes(worker._id.toString());
      if (!isPresent) absentCount++;
      
      const recordDetails = attendanceRecords.find(record => record.workerId._id.toString() === worker._id.toString());
      
      return {
        workerId: worker._id,
        name: worker.name,
        photoUrl: worker.photoUrl,
        jobRole: worker.jobRole,
        place: worker.place,
        contactNumber: worker.contactNumber,
        dailyWage: worker.dailyWage,
        status: isPresent ? 'Present' : 'Absent',
        time: isPresent ? recordDetails.time : null
      };
    });

    res.status(200).json({
      date: targetDate,
      totalWorkers: allWorkers.length,
      present: presentCount,
      absent: absentCount,
      details: reportData
    });

  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};
