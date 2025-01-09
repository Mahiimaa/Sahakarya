const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false 
  }
});

class OTPStore {
  constructor() {
    this.store = new Map();
    
    setInterval(() => this.cleanup(), 60000);
  }

  set(email, data) {
    this.store.set(email, data);
  }

  get(email) {
    return this.store.get(email);
  }

  delete(email) {
    this.store.delete(email);
  }

  cleanup() {
    const now = Date.now();
    for (const [email, data] of this.store.entries()) {
      if (now - data.timestamp > 60000) { // 60 seconds
        this.store.delete(email);
      }
    }
  }
}

const otpStore = new OTPStore();

// Generate secure OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Email template for OTP
const createOTPEmailTemplate = (otp) => {
  return {
    subject: 'Forgot Password OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Forgot Password OTP</h2>
        <p>Your OTP for Forgot Password is:</p>
        <h1 style="color: "#6C77EE"; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px;">
          ${otp}
        </h1>
        <p style="color: #666;">This OTP will expire in 60 seconds.</p>
        <p style="color: #666;">If you didn't initiate this request, please ignore this email.</p>
        <div style="margin-top: 20px; padding: 20px; background-color: #f8f8f8; border-radius: 5px;">
          <p style="margin: 0; color: #888; font-size: 12px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    `
  };
};

const requestOTP = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check for existing OTP request
    const existingOTP = otpStore.get(email);
    if (existingOTP && Date.now() - existingOTP.timestamp < 30000) { // 30 seconds cooldown
      return res.status(429).json({ 
        error: "Please wait 30 seconds before requesting another OTP",
        waitTime: Math.ceil((30000 - (Date.now() - existingOTP.timestamp)) / 1000)
      });
    }

    const otp = generateOTP();
    
    // Store OTP with timestamp and attempts
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    const emailTemplate = createOTPEmailTemplate(otp);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    res.json({ 
      message: "OTP sent successfully",
      validityPeriod: "60 seconds"
    });

  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: "Failed to send OTP. Please try again later." });
  }
};

// Verify OTP endpoint with security measures
const submitOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({ error: "No active OTP request found. Please request a new OTP." });
    }

    if (Date.now() - otpData.timestamp > 60000) {
      otpStore.delete(email);
      return res.status(400).json({ 
        error: "OTP has expired. Please request a new one.",
        expired: true
      });
    }

    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      if (otpData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ 
          error: "Too many invalid attempts. Please request a new OTP.",
          maxAttemptsReached: true
        });
      }
      return res.status(400).json({ 
        error: "Invalid OTP",
        remainingAttempts: 3 - otpData.attempts
      });
    }

    // OTP is valid - generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOneAndUpdate(
      { email },
      { 
        resetToken,
        resetTokenExpiry: Date.now() + 3600000 // 1 hour
      },
      { new: true }
    );

    otpStore.delete(email);

    res.json({ 
      message: "OTP verified successfully",
      resetToken,
      expiresIn: '1 hour'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
};

// Reset Password endpoint with validation
const resetPassword = async (req, res) => {
  const { email, password, resetToken } = req.body;

  if (!email || !password || !resetToken) {
    return res.status(400).json({ error: "Email, password, and reset token are required" });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  try {
    const user = await User.findOne({ 
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired reset token. Please restart the password reset process." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update password and clear reset token
    await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        passwordChangedAt: Date.now()
      }
    );

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
        </div>
      `
    });

    res.json({ 
      message: "Password reset successful",
      passwordChanged: true
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
};

module.exports = {
  requestOTP,
  submitOTP,
  resetPassword
};