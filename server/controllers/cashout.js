const User = require('../models/User');
const Transaction = require('../models/Transaction');
require("dotenv").config();

const requestCashout = async (req, res) => {
  const { creditAmount, accountDetails } = req.body;
  const userId = req.user.id;
  
  if (!creditAmount || creditAmount <= 0) {
    return res.status(400).json({ message: 'Valid credit amount is required' });
  }
  
  if (!accountDetails || !accountDetails.accountNumber || !accountDetails.bank) {
    return res.status(400).json({ message: 'Bank account details are required' });
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
    
    const transactionId = `cashout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pendingCashout = await Transaction.create({
      transactionId: transactionId,
      sender: systemAccount._id,
      recipient: user._id,
      amount: cashValue,
      type: 'cashout',
      details: `Requested cashout of ${creditAmount} time credits for Rs. ${cashValue}`,
      status: 'pending',
      userId: userId,
      creditAmount: creditAmount,
      accountDetails: {
        accountNumber: accountDetails.accountNumber,
        bank: accountDetails.bank,
        name: accountDetails.name || user.name || user.username,
        contact: accountDetails.contact || user.phoneNumber
      }
    });
    
    user.timeCredits -= creditAmount;
    await user.save();
    
    return res.json({
      success: true,
      message: 'Cashout request submitted successfully',
      transaction: {
        id: pendingCashout._id,
        status: 'pending',
        amount: cashValue,
        credits: creditAmount
      },
      remainingCredits: user.timeCredits
    });
    
  } catch (error) {
    console.error("Cashout Request Error:", error);
    
    return res.status(500).json({
      message: 'Error processing cashout request',
      error: error.message
    });
  }
};

const getCashoutHistory = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const transactions = await Transaction.find({
      userId: userId,
      type: 'cashout'
    }).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      transactions
    });
    
  } catch (error) {
    console.error("Cashout History Error:", error);
    
    return res.status(500).json({
      message: 'Error fetching cashout history',
      error: error.message
    });
  }
};

const updateCashoutStatus = async (req, res) => {
  const { transactionId, status, notes } = req.body;
  const adminId = req.user.id;
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized - Admin access required' });
  }
  
  if (!transactionId || !status) {
    return res.status(400).json({ message: 'Transaction ID and status are required' });
  }
  
  if (!['completed', 'rejected', 'processing'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  
  try {
    const transaction = await Transaction.findOne({ 
      transactionId: transactionId,
      type: 'cashout'
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Cashout transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.status(400).json({ message: 'Transaction already completed' });
    }
    
    if (status === 'rejected' && transaction.status !== 'rejected') {
      const user = await User.findById(transaction.userId);
      if (user) {
        user.timeCredits += transaction.creditAmount;
        await user.save();
      }
    }
    
    transaction.status = status;
    if (notes) {
      transaction.adminNotes = notes;
    }
    transaction.processedBy = adminId;
    transaction.processedAt = new Date();
    
    await transaction.save();
    
    return res.json({
      success: true,
      message: `Cashout request ${status}`,
      transaction: transaction._id
    });
    
  } catch (error) {
    console.error("Cashout Status Update Error:", error);
    
    return res.status(500).json({
      message: 'Error updating cashout status',
      error: error.message
    });
  }
};

module.exports = { 
  requestCashout,
  getCashoutHistory,
  updateCashoutStatus
};