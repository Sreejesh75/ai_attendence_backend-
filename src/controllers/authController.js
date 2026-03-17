const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Request OTP using phone number
exports.requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate a 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      user = new User({
        phoneNumber,
        otp: generatedOtp,
        otpExpires
      });
    } else {
      user.otp = generatedOtp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    // In a real production app, you would send this via Twilio or an SMS gateway.
    // For now, we return it in the response so you can test it easily!
    res.status(200).json({ 
      message: 'OTP sent successfully', 
      otpForTesting: generatedOtp // Exposing for ease of development!
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating OTP', error: error.message });
  }
};

// 2. Verify OTP and Set Password
exports.verifyAndSetPassword = async (req, res) => {
  try {
    const { phoneNumber, otp, password } = req.body;

    if (!phoneNumber || !otp || !password) {
      return res.status(400).json({ message: 'Phone number, OTP, and password are required' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear the OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    // Automatically generate a token so they are logged in right after setting the password
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Password set successfully. You can now use the app.',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error setting password', error: error.message });
  }
};

// 3. Login using phone number and password
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials or password not set' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};
