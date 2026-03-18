const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request an OTP to a phone number
 *     description: Used for login/signup. In dev mode, returns the OTP directly in response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/request-otp', authController.requestOtp);

/**
 * @swagger
 * /api/auth/verify-and-set-password:
 *   post:
 *     summary: Verify OTP and set a new password
 *     description: User submits the OTP and their new password. Returns an auth token upon success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: The new password to set
 *     responses:
 *       200:
 *         description: Password set and user authenticated
 */
router.post('/verify-and-set-password', authController.verifyAndSetPassword);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with phone number and password
 *     description: Standard login after password has been set.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post('/login', authController.login);

// Profile Management (Protected Routes)
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.delete('/profile', authMiddleware, authController.deleteAccount);

module.exports = router;
