const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const signup = async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  if (!email || !username || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    // Check if user already exists with either email or username
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Error creating user" });
  }
};

const login = async (req, res) => {  // Added async keyword
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // First, find by email
    const userByEmail = await User.findOne({ email: email });
    
    if (!userByEmail) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    // Then check if username matches
    if (userByEmail.username !== username) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    // Finally check password
    const isPasswordCorrect = await bcrypt.compare(password, userByEmail.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { 
        id: userByEmail._id,
        email: userByEmail.email,
        username: userByEmail.username 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token, 
      userId: userByEmail._id,
      email: userByEmail.email, 
      username: userByEmail.username 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const otpStore = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Request OTP endpoint
const requestOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 60 seconds.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: "Error sending OTP" });
  }
};

// Verify OTP endpoint
const submitOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({ error: "No OTP request found" });
    }

    // Check if OTP is expired (60 seconds)
    if (Date.now() - otpData.timestamp > 60000) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      if (otpData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ error: "Too many attempts. Please request a new OTP" });
      }
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP is valid
    otpStore.delete(email);
    
    // Generate a temporary token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOneAndUpdate(
      { email },
      { 
        resetToken,
        resetTokenExpiry: Date.now() + 3600000 // 1 hour
      }
    );

    res.json({ 
      message: "OTP verified successfully",
      resetToken 
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: "Error verifying OTP" });
  }
};

// Reset Password endpoint
const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ 
      email,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    );

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: "Error resetting password" });
  }
};
const logout = (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });
    console.log("Cookie cleared");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
};

// Add these to your existing exports
module.exports = {
  login,
  signup,
  requestOTP,
  submitOTP,
  resetPassword,
  logout,
};