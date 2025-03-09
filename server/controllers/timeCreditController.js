const { v4: uuidv4 } = require("uuid");
const User = require('../models/User');
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const bcrypt = require('bcrypt');

const transferTimeCredit = async (req, res) => {
  const { providerId, amount, password } = req.body;
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    if (!providerId || !amount || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const transferAmount = parseInt(amount);
    if (transferAmount <= 0) {
      return res.status(400).json({ error: "Time credits must be greater than 0." });
    }

    const requester = await User.findById(userId).select("+password");
    const provider = await User.findById(providerId);
    if (!requester || !provider) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, requester.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    if (requester.timeCredits < transferAmount) {
      return res.status(400).json({ error: "Insufficient time credits." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Service must be completed before transferring credits." });
    }
    requester.timeCredits -= transferAmount;
    provider.timeCredits += transferAmount;
    await requester.save();
    await provider.save();
    
    const transactionId = uuidv4();

    const transaction = new Transaction({
      transactionId,
      sender: requester._id,
      recipient: provider._id,
      amount: transferAmount,
      type: "service_payment",
      details: `Transferred ${transferAmount} time credits for service ${booking.service}`,
    });
    await transaction.save();
    
    booking.status = "credit transferred";
    await booking.save();
    res.json({ message: "Time credits transferred successfully!", requesterBalance: requester.timeCredits });
  } catch (error) {
    console.error("Error transferring time credits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { transferTimeCredit };
