const axios = require("axios");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
require("dotenv").config();

const verifyTransaction =async (req, res) => {
    const { token, amount } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ message: 'Token and amount are required' });
    }
  
    try {
      const verificationResponse = await axios.post(
        'https://khalti.com/api/v2/payment/verify/',
        {
          token, amount
        },
        {
          headers: {
            'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          },
        }
      );
      console.log("Khalti Secret Key:", process.env.KHALTI_SECRET_KEY);
      console.log("Khalti Response:", verificationResponse.data);
      const responseData = verificationResponse.data;
      if (responseData.idx) { 
        const creditsToAdd = Math.floor(amount / 1000);

        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        user.timeCredits += creditsToAdd;
        await user.save();

        await Transaction.create({
          userId: user._id,
          amount: creditsToAdd,
          type: 'purchase',
          details: `Purchased ${creditsToAdd} time credits via Khalti.`
        });
  
        return res.json({ message: 'Payment verified and credits updated', credits: user.timeCredits });
      } else {
        return res.status(400).json({ message: 'Payment verification failed', details: responseData });
      }
    } catch (error) {
      console.error("Verification Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
  };

  const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ 
      $or: [{ sender: userId }, { recipient: userId }, { userId }]
    })
    .populate("sender", "username email") 
    .populate("recipient", "username email") 
    .populate({
      path: "bookingId",
      select: "service",
      strictPopulate: false,
    }) 
    .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  };
  
  module.exports = {verifyTransaction, getTransactions}