const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Booking = require('../models/Booking');
// const { validationResult } = require('express-validator');

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({
      $or: [
        { sender: userId },
        { recipient: userId },
        { userId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username email profileImage')
    .populate('recipient', 'username email profileImage')
    .populate({
      path: 'bookingId',
      select: 'service date status',
      populate: {
        path: 'service',
        select: 'title'
      }
    });
    const enhancedTransactions = transactions.map(transaction => {
      const isOutgoing = transaction.sender?._id?.toString() === userId;
      
      return {
        _id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        creditAmount: transaction.creditAmount,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt,
        bookingId: {
          _id: transaction.bookingId?._id,
          service: transaction.bookingId?.service?.title || 'Direct Transfer',
          date: transaction.bookingId?.date,
          status: transaction.bookingId?.status
        },
        recipient: transaction.recipient,
        sender: transaction.sender,
        details: transaction.details,
        paymentId: transaction.paymentId,
        currentUserId: userId
      };
    });

    res.status(200).json(enhancedTransactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};
const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('sender', 'username email profileImage')
      .populate('recipient', 'username email profileImage')
      .populate({
        path: 'bookingId',
        select: 'service date status',
        populate: {
          path: 'service',
          select: 'title description'
        }
      });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (
      transaction.sender._id.toString() !== userId && 
      transaction.recipient._id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Unauthorized to view this transaction' });
    }
    
    res.status(200).json(transaction);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ message: 'Server error while fetching transaction details' });
  }
};

const createBookingTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { bookingId, amount } = req.body;
  const senderId = req.user.id;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('service', 'provider cost title')
      .populate('user');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user._id.toString() !== senderId) {
      return res.status(403).json({ message: 'Unauthorized to make payment for this booking' });
    }

    if (booking.isPaid) {
      return res.status(400).json({ message: 'Booking is already paid' });
    }
    if (amount !== booking.service.cost) {
      return res.status(400).json({ 
        message: 'Payment amount does not match service cost',
        expectedAmount: booking.service.cost
      });
    }
    const sender = await User.findById(senderId);
    if (sender.timeCredits < amount) {
      return res.status(400).json({ message: 'Insufficient time credits' });
    }

    const recipientId = booking.service.provider;
    const recipient = await User.findById(recipientId);

    const transactionId = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const transaction = new Transaction({
      transactionId,
      sender: senderId,
      recipient: recipientId,
      amount,
      type: "service_payment",
      status: "completed",
      details: `Payment for ${booking.service.title}`,
      bookingId: booking._id,
      userId: senderId,
      creditAmount: amount
    });

    sender.timeCredits -= amount;
    recipient.timeCredits += amount;
    booking.isPaid = true;
    booking.paymentDate = Date.now();

    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      await transaction.save({ session });
      await sender.save({ session });
      await recipient.save({ session });
      await booking.save({ session });
      
      await session.commitTransaction();
      session.endSession();

      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('sender', 'username email')
        .populate('recipient', 'username email')
        .populate({
          path: 'bookingId',
          populate: {
            path: 'service',
            select: 'title'
          }
        });

      res.status(201).json(populatedTransaction);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error('Error creating booking payment:', err);
    res.status(500).json({ message: 'Server error while creating payment' });
  }
};

const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactions = await Transaction.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    });
    let totalEarned = 0;
    let totalSpent = 0;
    
    transactions.forEach(transaction => {
      if (transaction.recipient.toString() === userId) {
        totalEarned += transaction.amount;
      } else {
        totalSpent += transaction.amount;
      }
    });
    const user = await User.findById(userId);
    const currentBalance = user.timeCredits;

    const totalTransactions = transactions.length;
    
    res.status(200).json({
      totalEarned,
      totalSpent,
      currentBalance,
      totalTransactions,
      netChange: totalEarned - totalSpent
    });
  } catch (err) {
    console.error('Error fetching transaction stats:', err);
    res.status(500).json({ message: 'Server error while fetching transaction statistics' });
  }
};

module.exports={getTransactions, getTransactionById, createBookingTransaction, getTransactionStats}