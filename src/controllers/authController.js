const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * AUTHENTICATION CONTROLLER
 * Handles user lifecycle: OTP, Registration, Login, and Profile Management.
 */

// --- Constants & Helpers ---
const JWT_EXPIRES = '7d';
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a standard JWT for a user
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: JWT_EXPIRES });
};

// --- Core Auth Logic ---

/**
 * @desc    Request a 4-digit OTP via phone
 * @route   POST /api/auth/request-otp
 */
exports.requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

    // Generate Verification Data
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert User (Create if not exists)
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber, otp, otpExpires: expires, role: 'Admin' });
    } else {
      user.otp = otp;
      user.otpExpires = expires;
    }

    await user.save();

    // Response (Testing mode: return OTP in body)
    res.status(200).json({ 
      message: 'OTP sent successfully', 
      otpForTesting: otp 
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error during OTP generation', error: error.message });
  }
};

/**
 * @desc    Verify OTP and establish account password
 * @route   POST /api/auth/verify-and-set-password
 */
exports.verifyAndSetPassword = async (req, res) => {
  try {
    const { phoneNumber, otp, password } = req.body;
    if (!phoneNumber || !otp || !password) {
      return res.status(400).json({ message: 'All fields (phone, OTP, password) are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Security Checks
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // Hash Password & Clean OTP
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.status(200).json({
      message: 'Account secured. Welcome!',
      token: generateToken(user),
      user: { id: user._id, phoneNumber: user.phoneNumber, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify account', error: error.message });
  }
};

/**
 * @desc    Authenticate existing user
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) return res.status(400).json({ message: 'Credentials missing' });

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid phone or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid phone or password' });

    res.status(200).json({
      message: 'Authentication successful',
      token: generateToken(user),
      user: { id: user._id, phoneNumber: user.phoneNumber, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login service unavailable', error: error.message });
  }
};

// --- Profile Management ---

/**
 * @desc    Get authenticated user details
 * @route   GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Profile not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

/**
 * @desc    Submit updates to user name/role
 * @route   PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, role } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();
    
    const profile = user.toObject();
    delete profile.password;
    
    res.json({ message: 'Profile updated', user: profile });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

/**
 * @desc    Remove account and all associated data
 * @route   DELETE /api/auth/profile
 */
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account permanently removed' });
  } catch (error) {
    res.status(500).json({ message: 'Accout deletion failed', error: error.message });
  }
};
