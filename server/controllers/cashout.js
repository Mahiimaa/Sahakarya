const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { initiateKhaltiPayout } = require('../services/khaltiService');
require("dotenv").config();

const requestKhaltiCashout = async (req, res) => {
  const { creditAmount, phoneNumber, remarks } = req.body;
  const userId = req.user.id;
  
  if (!creditAmount || creditAmount <= 0) {
    return res.status(400).json({ message: 'Valid credit amount is required' });
  }
  
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Khalti phone number is required' });
  }

  const phoneRegex = /^9\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.timeCredits || user.timeCredits < creditAmount) {
      return res.status(400).json({ 
        message: 'Insufficient credits',
        currentCredits: user.timeCredits || 0
      });
    }
    
    const cashValue = creditAmount * (100 / 100); 
    
    let systemAccount = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!systemAccount) {
      return res.status(500).json({ message: 'System account not configured' });
    }
    
    const transactionId = `khalti-cashout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
      const pendingCashout = await Transaction.create({
      transactionId: transactionId,
      sender: systemAccount._id,
      recipient: user._id,
      amount: cashValue,
      type: 'khalti-cashout',
      details: `Requested cashout of ${creditAmount} time credits to Khalti wallet`,
      status: 'pending',
      userId: userId,
      creditAmount: creditAmount,
      khaltiDetails: {
        phoneNumber: phoneNumber,
        remarks: remarks || `Cashout for ${creditAmount} credits`
      }
    });
        user.timeCredits -= creditAmount;
    await user.save();
    
    try {
      const payoutDetails = {
        amount: cashValue * 100, 
        phone: phoneNumber,
        transaction_id: transactionId,
        remarks: remarks || `Cashout for ${creditAmount} credits`,
        name: user.name || user.username
      };
      
      const khaltiResponse = await initiateKhaltiPayout(payoutDetails);
      
      pendingCashout.khaltiDetails.payoutId = khaltiResponse.payout_id;
      pendingCashout.khaltiDetails.token = khaltiResponse.token;
      
      if (khaltiResponse.status === 'PENDING') {
        pendingCashout.status = 'processing';
        pendingCashout.details = `Khalti payout initiated for ${creditAmount} credits`;
      } else if (khaltiResponse.status === 'COMPLETED') {
        pendingCashout.status = 'completed';
        pendingCashout.details = `Khalti payout completed for ${creditAmount} credits`;
      }
      
      await pendingCashout.save();
      
      return res.json({
        success: true,
        message: 'Cashout request submitted successfully',
        transaction: {
          id: pendingCashout._id,
          status: pendingCashout.status,
          amount: cashValue,
          credits: creditAmount,
          khaltiToken: khaltiResponse.token
        },
        remainingCredits: user.timeCredits
      });
      
    } catch (khaltiError) {
      console.error("Khalti Payout Error:", khaltiError);

      user.timeCredits += creditAmount;
      await user.save();
      
      pendingCashout.status = 'failed';
      pendingCashout.details = `Failed to process Khalti payout: ${khaltiError.message || 'Unknown error'}`;
      await pendingCashout.save();
      
      return res.status(500).json({
        message: 'Failed to process payout to Khalti',
        error: khaltiError.response?.data || khaltiError.message
      });
    }
    
  } catch (error) {
    console.error("Khalti Cashout Request Error:", error);
    
    return res.status(500).json({
      message: 'Error processing cashout request',
      error: error.message
    });
  }
};

const verifyKhaltiPayout = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Khalti token is required' });
  }
  
  try {
    const transaction = await Transaction.findOne({
      'khaltiDetails.token': token,
      type: 'khalti-cashout'
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        transaction: transaction._id
      });
    }
    return res.json({
      success: true,
      status: transaction.status,
      transaction: transaction._id
    });
    
  } catch (error) {
    console.error("Khalti Status Verification Error:", error);
    
    return res.status(500).json({
      message: 'Error verifying Khalti payout status',
      error: error.message
    });
  }
};

const handleKhaltiPayoutWebhook = async (req, res) => {
  try {
    const { token, status, transaction_id, amount } = req.body;
    
    if (!token || !status || !transaction_id) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    const transaction = await Transaction.findOne({ 
      transactionId: transaction_id,
      type: 'khalti-cashout'
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (status === 'COMPLETED') {
      transaction.status = 'completed';
      transaction.details = `Khalti payout completed for ${transaction.creditAmount} credits`;
      await transaction.save();
    } else if (status === 'FAILED') {
      transaction.status = 'failed';
      transaction.details = `Khalti payout failed: ${req.body.message || 'Unknown reason'}`;
      await transaction.save();
      const user = await User.findById(transaction.userId);
      if (user) {
        user.timeCredits += transaction.creditAmount;
        await user.save();
      }
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Khalti Webhook Error:", error);
    return res.status(500).json({ message: 'Error processing webhook' });
  }
};

module.exports = {
  requestKhaltiCashout,
  verifyKhaltiPayout,
  handleKhaltiPayoutWebhook
};