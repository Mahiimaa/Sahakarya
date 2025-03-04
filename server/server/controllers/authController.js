const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

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

    console.log('Creating user with role:', userRole);

    const user = new User({ email, username, password: hashedPassword, role: userRole });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Error creating user" });
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
    logout,
};