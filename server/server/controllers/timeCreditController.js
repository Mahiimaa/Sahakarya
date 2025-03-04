const User = require('../models/User');
const bcrypt = require('bcrypt');

const transferTimeCredit = async (req, res) => {
  const { recipient, amount, password } = req.body; 
  const senderId = req.user.id;

  try {
    if (!recipient || !amount || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const sender = await User.findById(senderId);
    
    const recipientUser = await User.findOne({ 
      $or: [{ email: recipient }, { username: recipient }] 
    });

    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, sender.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    if (sender.timeCredits < amount) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    sender.timeCredits -= amount;
    recipientUser.timeCredits += amount;

    await sender.save();
    await recipientUser.save();

    res.status(200).json({ message: "Transfer successful!" });
  } catch (error) {
    res.status(500).json({ message: "Error processing transfer", error: error.message });
  }
};

module.exports = { transferTimeCredit };
