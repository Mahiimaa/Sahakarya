const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { transporter } = require('../config/nodeMailerConfig');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signup = async (req, res) => {
  const { email, username, password, confirmPassword, role } = req.body;

  if (!email || !username || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
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
    const userRole = role || 'user';

    const verificationOTP = generateOTP();
    const tokenExpiry = new Date();

    const expiryTimeInMs = parseInt(process.env.OTP_EXPIRY_TIME) || 3600000; // Default 1 hour if not set
    tokenExpiry.setTime(tokenExpiry.getTime() + expiryTimeInMs);

    console.log('Creating user with role:', userRole);

    const user = new User({ 
      email, 
      username, 
      password: hashedPassword, 
      role: userRole,
      isVerified: false,
      verificationOTP,
      otpExpiry: tokenExpiry
    });
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${username},</p>
        <p>Thank you for registering with Sahakarya. Please use the following OTP to verify your email:</p>
        <h2 style="text-align: center; padding: 10px; background-color: #f0f0f0; font-size: 24px; letter-spacing: 5px;">${verificationOTP}</h2>
        <p>This OTP will expire in ${Math.round(expiryTimeInMs / (1000 * 60))} minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Error creating user" });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ 
      email,
      verificationOTP: otp,
      otpExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired OTP" 
      });
    }
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ 
      message: "Email verified successfully. You can now log in." 
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    
    const verificationOTP = generateOTP();
    const tokenExpiry = new Date();
    
    const expiryTimeInMs = parseInt(process.env.OTP_EXPIRY_TIME) || 3600000; // Default 1 hour if not set
    tokenExpiry.setTime(tokenExpiry.getTime() + expiryTimeInMs);
    
    user.verificationOTP = verificationOTP;
    user.otpExpiry = tokenExpiry;
    await user.save();
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${user.username},</p>
        <p>Please use the following OTP to verify your email:</p>
        <h2 style="text-align: center; padding: 10px; background-color: #f0f0f0; font-size: 24px; letter-spacing: 5px;">${verificationOTP}</h2>
        <p>This OTP will expire in ${Math.round(expiryTimeInMs / (1000 * 60))} minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification OTP resent successfully" });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: "Failed to resend verification OTP" });
  }
};


const login = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userByEmail = await User.findOne({ email: email });
    
    if (!userByEmail) {
      return res.status(401).json({ message: 'Invalid email' });
    }
    if (userByEmail.username !== username) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    if (!userByEmail.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in' 
      });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userByEmail.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { 
        id: userByEmail._id,
        email: userByEmail.email,
        username: userByEmail.username,
        role: userByEmail.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token,
      role: userByEmail.role, 
      userId: userByEmail._id,
      email: userByEmail.email,
      username: userByEmail.username 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
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


module.exports = {
  login,
  signup,
  verifyEmail,
  resendVerification,
    logout,
};