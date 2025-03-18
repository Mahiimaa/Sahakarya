const axios = require("axios");
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
require("dotenv").config();

const verifyTransaction =async (req, res) => {
    const { token, amount } = req.body;
    const userId = req.user.id;

    if (!token || !amount) {
      return res.status(400).json({ message: 'Token and amount are required' });
    }
  
      const secretKey = process.env.KHALTI_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing KHALTI_SECRET_KEY in environment variables");
    return res.status(500).json({ message: 'Payment configuration error' });
  }
  
  try {
    console.log(`Verifying payment: Amount=${amount}, Token=${token.substring(0, 10)}...`);

    const khaltiEndpoint = 'https://dev.khalti.com/api/v2/payment/verify/';
    
    console.log(`Using Khalti endpoint: ${khaltiEndpoint}`);
    
    const verificationResponse = await axios.post(
      khaltiEndpoint,
      { token, amount },
      {
        headers: {
          'Authorization': `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log("Khalti verification successful:", verificationResponse.data);
    const responseData = verificationResponse.data;
    
    if (responseData.idx) { 
      const creditsToAdd = Math.floor(amount / 10000);
      console.log(`Adding ${creditsToAdd} credits to user ${userId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }

      const previousCredits = user.timeCredits || 0;
      user.timeCredits = previousCredits + creditsToAdd;
      await user.save();
      const transaction = await Transaction.create({
        userId: user._id,
        amount: amount / 100, 
        type: 'purchase',
        details: `Purchased ${creditsToAdd} time credits via Khalti`,
        paymentId: responseData.idx,
        status: 'completed'
      });
      
      console.log(`Transaction recorded with ID: ${transaction._id}`);
      
      return res.json({ 
        message: 'Payment verified and credits updated', 
        credits: user.timeCredits,
        transaction: transaction._id
      });
    } else {
      console.error("Invalid verification response:", responseData);
      return res.status(400).json({ 
        message: 'Payment verification failed', 
        details: responseData 
      });
    }
  } catch (error) {
    console.error("Verification Error:", error);

    let errorMessage = 'Error verifying payment';
    let errorDetails = {};
    
    if (error.response) {
      console.error("Response Error Data:", error.response.data);
      console.error("Response Error Status:", error.response.status);
      console.error("Response Error Headers:", error.response.headers);
      
      errorMessage = 'Khalti server responded with an error';
      errorDetails = {
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      console.error("Request Error:", error.request);
      errorMessage = 'No response received from Khalti';
      errorDetails = {
        request: 'Request was sent but no response was received'
      };
    } else {
      console.error("Error Message:", error.message);
      errorMessage = 'Error setting up payment verification';
      errorDetails = {
        message: error.message
      };
    }
    
    return res.status(500).json({
      message: errorMessage,
      error: errorDetails
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching transactions for user: ${userId}`);
    
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

    console.log(`Found ${transactions.length} transactions`);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
  
  module.exports = {verifyTransaction, getTransactions}