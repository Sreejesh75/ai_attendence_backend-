const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

exports.markAttendance = async (req, res) => {
  try {
    const { workerId } = req.body;
    
    if (!workerId) {
      return res.status(400).json({ message: 'workerId is required' });
    }

    const worker = await Worker.findOne({ _id: workerId, adminId: req.user.id });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found or you don\'t have permission to mark attendance for this worker' });
    }

    // Standardize date and time (IST - UTC+5:30)
    const now = dayjs().utcOffset(330);
    const date = now.format('YYYY-MM-DD');
    const time = now.format('hh:mm A'); // e.g., 09:15 AM

    // Check if attendance already marked for today
    const existingRecord = await Attendance.findOne({ workerId, date });
    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already marked for today', record: existingRecord });
    }

    const newAttendance = new Attendance({
      workerId,
      date,
      time,
      adminId: req.user.id
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

    // Get only workers belonging to this admin
    const allWorkers = await Worker.find({ adminId: req.user.id });
    
    // Get attendance records for the target date belonging to this admin
    const rawRecords = await Attendance.find({ date: targetDate, adminId: req.user.id }).populate('workerId', 'name photoUrl');
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

exports.getDashboardSummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    const now = dayjs().utcOffset(330);
    const todayStr = now.format('YYYY-MM-DD');

    // 1. Get Today's Stats
    const allWorkers = await Worker.find({ adminId });
    const todayRecords = await Attendance.find({ date: todayStr, adminId }).populate('workerId', 'dailyWage');
    
    const totalWorkers = allWorkers.length;
    const presentToday = todayRecords.length;
    let totalEstimatedWage = 0;
    
    todayRecords.forEach(record => {
      if (record.workerId && record.workerId.dailyWage) {
        totalEstimatedWage += record.workerId.dailyWage;
      }
    });

    // 2. Get Last 7 Days Trends
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').format('YYYY-MM-DD');
      const count = await Attendance.countDocuments({ date: d, adminId });
      last7Days.push({
        date: d,
        day: now.subtract(i, 'day').format('ddd'),
        count
      });
    }

    // 3. Recent Activity (Last 5 scans)
    const recentActivity = await Attendance.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('workerId', 'name photoUrl jobRole');

    res.status(200).json({
      today: {
        totalWorkers,
        presentCount: presentToday,
        totalEstimatedWage,
      },
      trends: last7Days,
      recentActivity: recentActivity.map(record => ({
        id: record._id,
        workerName: record.workerId ? record.workerId.name : 'Unknown',
        photoUrl: record.workerId ? record.workerId.photoUrl : null,
        jobRole: record.workerId ? record.workerId.jobRole : 'Worker',
        time: record.time,
        date: record.date
      }))
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
};
