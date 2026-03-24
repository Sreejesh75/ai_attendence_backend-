const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all attendance routes
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - workerId
 *       properties:
 *         workerId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         time:
 *           type: string
 */

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Mark attendance using face detection AI
 *     description: This endpoint is called when AI successfully recognizes a worker's face.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerId
 *             properties:
 *               workerId:
 *                 type: string
 *                 description: ID of the recognized worker
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       400:
 *         description: Invalid input or already marked
 */
router.post('/', attendanceController.markAttendance);

/**
 * @swagger
 * /api/attendance/report:
 *   get:
 *     summary: Retrieve attendance report
 *     description: View details of workers present and absent on a specific date.
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *         description: Date format YYYY-MM-DD (Defaults to today)
 *     responses:
 *       200:
 *         description: Attendance report with list of presents and absents
 */
router.get('/report', attendanceController.getAttendanceReport);
router.get('/summary', attendanceController.getDashboardSummary);

module.exports = router;
