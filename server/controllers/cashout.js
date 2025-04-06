const User = require('../models/User');
const Transaction = require('../models/Transaction');
require("dotenv").config();

const requestCashout = async (req, res) => {
  const { creditAmount, phoneNumber, remarks } = req.body;
  const userId = req.user.id;
  
  if (!creditAmount || creditAmount <= 0 || !phoneNumber) {
    return res.status(400).json({ message: 'Valid credit amount is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.timeCredits < creditAmount) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    user.timeCredits -= creditAmount;
    await user.save();

    const transaction = await Transaction.create({
      transactionId: `cashout-${Date.now()}`,
      sender: user._id,
      recipient: user._id,
      amount: creditAmount, 
      creditAmount,
      phoneNumber,
      remarks,
      type: 'khalti-cashout', 
      details: `Cashout request for ${creditAmount} credits to ${phoneNumber}`, // ✅ required
      status: 'pending',
      userId: userId
    });

    res.status(200).json({
      message: 'Cashout request submitted successfully!',
      transaction,
      remainingCredits: user.timeCredits
    });

  } catch (error) {
    console.error("Cashout request error:", error);
    res.status(500).json({ message: 'Failed to submit cashout request' });
  }
};
const updateTransactionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['completed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    if (transaction.type === 'khalti-cashout' && status === 'rejected') {
      const user = await User.findById(transaction.sender);
      user.timeCredits += transaction.creditAmount;
      await user.save();
    }
    
    transaction.status = status;
    transaction.details = `Manually marked as ${status} by admin`;
    transaction.fulfilledAt = new Date();
    transaction.fulfilledBy = req.user?.id || null; 
    await transaction.save();

    res.status(200).json({ message: 'Transaction updated', transaction });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCashoutStatus = async (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  try {
    const tx = await Transaction.findOne({ _id: transactionId, userId });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    res.json({ status: tx.status });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  requestCashout, updateTransactionStatus, getCashoutStatus }