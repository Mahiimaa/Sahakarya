const express = require('express');
const Report = require('../models/Report');
const Warning = require("../models/Warning");

const reportUser = async (req, res) => {
  try {
    const { bookingId, description } = req.body;
    if (!bookingId || !description) {
      return res.status(400).json({ error: 'Booking ID and description are required' });
    }

    const newReport = await Report.create({
      bookingId,
      reportedBy: req.user._id,
      description,
    });

    res.status(201).json(newReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

const getReports = async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      const reports = await Report.find()
        .populate('bookingId', 'service requester provider') 
        .populate('reportedBy', 'username email') 
        .sort({ createdAt: -1 });
  
      res.json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

const sendWarning = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }

    const warning = await Warning.create({ userId, message });

    await Report.updateMany({ reportedBy: userId }, { status: 'warning_sent' });

    res.status(201).json({ message: 'Warning sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send warning' });
  }
}

const getWarnings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const warnings = await Warning.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(warnings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch warnings' });
  }
}

module.exports = {reportUser, getReports, sendWarning, getWarnings};
