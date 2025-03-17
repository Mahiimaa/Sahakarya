const { v4: uuidv4 } = require("uuid");
const User = require('../models/User');
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const bcrypt = require('bcrypt');

const transferTimeCredit = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.requester.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to transfer credits for this booking" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Booking must be completed before transferring credits" });
    }

    if (!booking.proposedCredits) {
      return res.status(400).json({ error: "No proposed credits amount found" });
    }

    const provider = await User.findById(booking.provider);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    const creditsToTransfer = Number(booking.proposedCredits);
    
    if (user.timeCredits < creditsToTransfer) {
      return res.status(400).json({ error: "Not enough time credits" });
    }

    user.timeCredits -= creditsToTransfer;
    provider.timeCredits += creditsToTransfer;
    booking.status = "credit transferred";

    await user.save();
    await provider.save();
    await booking.save();

    res.json({ 
      message: "Time credits transferred successfully", 
      status: booking.status 
    });
  } catch (error) {
    console.error("Error transferring credits:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { transferTimeCredit };
