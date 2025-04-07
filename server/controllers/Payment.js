const { initializeKhaltiPayment, verifyKhaltiPayment } = require('../services/khaltiService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
require("dotenv").config();
const { sendEmail } = require("../email");

const initiatePayment = async (req, res) => {
    const { amount, creditAmount } = req.body;
    const userId = req.user.id;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      let systemAccount = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!systemAccount) {
        return res.status(500).json({ message: 'System account not configured' });
      }
      const transactionId = `khalti-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const paymentDetails = {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        website_url: process.env.FRONTEND_URL,
        amount: amount,
        purchase_order_id: transactionId,
        purchase_order_name: `Time Credits Purchase`,
        customer_info: {
          name: user.name || user.username,
          email: user.email,
          phone: user.phoneNumber || '9876453765'
        },
        product_details: [
          {
            identity: 'time-credits',
            name: 'Time Credits',
            total_price: amount,
            quantity: creditAmount,
            unit_price: amount / creditAmount
          }
        ]
      };

      const response = await initializeKhaltiPayment(paymentDetails);
      
      const pendingTransaction = await Transaction.create({
        transactionId: transactionId,
        sender: user._id, 
        recipient: systemAccount._id, 
        amount: amount / 100,
        type: 'purchase',
        details: `Initiated purchase of ${creditAmount} time credits via Khalti`,
        paymentId: response.pidx,
        status: 'pending',
        userId: userId, 
        creditAmount: creditAmount
      });
      
      return res.json({
        success: true,
        paymentUrl: response.payment_url,
        pidx: response.pidx,
        transactionId: pendingTransaction.transactionId
      });
      
    } catch (error) {
      console.error("Payment Initiation Error:", error);
      
      return res.status(500).json({
        message: 'Error initiating payment',
        error: error.response?.data || error.message
      });
    }
  };
  
  const verifyPayment = async (req, res) => {
    const { pidx } = req.body;
    
    if (!pidx) {
      return res.status(400).json({ message: 'Payment ID (pidx) is required' });
    }
    
    try {
      const verificationData = await verifyKhaltiPayment(pidx);
      
      const transaction = await Transaction.findOne({ paymentId: pidx });
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      if (verificationData.status !== 'Completed') {
        return res.status(400).json({ 
          message: `Payment ${verificationData.status.toLowerCase()}`,
          status: verificationData.status
        });
      }
      
      if (transaction.status === 'completed') {
        const user = await User.findById(transaction.userId);
        return res.json({
          message: 'Payment already processed',
          credits: user.timeCredits,
          transaction: transaction._id
        });
      }
      
      const creditsToAdd = transaction.creditAmount;
      
      const user = await User.findById(transaction.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const previousCredits = user.timeCredits || 0;
      user.timeCredits = previousCredits + creditsToAdd;
      await user.save();

        const pendingBookings = await Booking.find({
          requester: user._id,
          status: "mediation resolved",
          creditTransferred: false
        }).populate("provider service");

        for (const booking of pendingBookings) {
          if (user.timeCredits >= booking.finaltimeCredits) {
            const provider = await User.findById(booking.provider._id);

            user.timeCredits -= booking.finaltimeCredits;
            provider.timeCredits += booking.finaltimeCredits;

            booking.creditTransferred = true;

            await Promise.all([user.save(), provider.save(), booking.save()]);
            const mediationTransaction = new Transaction({
              transactionId: `auto-mediation-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              sender: user._id,
              recipient: provider._id,
              amount: booking.finaltimeCredits,
              type: 'service_payment',
              status: 'completed',
              details: `Auto-cleared mediation transfer for "${booking.service?.serviceName || "a service"}"`,
              createdAt: new Date(),
            });
            await mediationTransaction.save();
            await sendEmail(
              user.email,
              "Mediation Transfer Completed",
              `Hi ${user.username},\n\nYour recent top-up has cleared the pending mediation transfer for "${booking.service?.serviceName}". The time credits have now been successfully transferred to ${provider.username}.\n\nThanks,\nSahakarya Team`
            );
          }
        }
      transaction.status = 'completed';
      transaction.details = `Purchased ${creditsToAdd} time credits via Khalti`;
      await transaction.save();
      
      return res.json({
        message: 'Payment verified and credits updated',
        credits: user.timeCredits,
        transaction: transaction._id
      });
      
    } catch (error) {
      console.error("Payment Verification Error:", error);
      
      return res.status(500).json({
        message: 'Error verifying payment',
        error: error.response?.data || error.message
      });
    }
  };
  const handlePaymentCallback = async (req, res) => {
    const { pidx, transaction_id, status } = req.query;
    
    try {
      const transaction = await Transaction.findOne({ paymentId: pidx });
      if (!transaction) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Transaction not found`);
      }
      const user = await User.findById(transaction.userId);
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=User not found`);
      }
      if (status === 'Completed') {
        await verifyKhaltiPayment(pidx);
        
        if (transaction.status === 'completed') {
          return res.redirect(`${process.env.FRONTEND_URL}/payment/success?credits=${user.timeCredits}`);
        }
        const creditsToAdd = transaction.creditAmount;
        const previousCredits = user.timeCredits || 0;
        user.timeCredits = previousCredits + creditsToAdd;
        await user.save();
        
        transaction.status = 'completed';
        transaction.details = `Purchased ${creditsToAdd} time credits via Khalti`;
        await transaction.save();
        
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?credits=${user.timeCredits}`);
      } else {
        transaction.status = 'failed';
        transaction.details = `Payment ${status.toLowerCase()}`;
        await transaction.save();
        
        return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Payment ${status.toLowerCase()}`);
      }
      
    } catch (error) {
      console.error("Payment Callback Error:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Payment verification failed`);
    }
  };
  

module.exports = { initiatePayment, verifyPayment, handlePaymentCallback };