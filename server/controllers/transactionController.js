const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const verifyTransaction =async (req, res) => {
    const { token, amount } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ message: 'Token and amount are required' });
    }
  
    try {
      const verificationResponse = await axios.post(
        'https://khalti.com/api/v2/payment/verify/',
        {
          token: token,
          amount: amount
        },
        {
          headers: {
            'Authorization': `Key ${KHALTI_SECRET_KEY}`
          }
        }
      );
  
      const responseData = verificationResponse.data;
      if (responseData.idx) { 
        const creditsToAdd = Math.floor(amount / 1000);

        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        user.timeCredits += creditsToAdd;
        await user.save();
  
        const transaction = new Transaction({
          userId: user._id,
          amount: creditsToAdd,
          type: 'purchase',
          details: `Purchased ${creditsToAdd} time credits via Khalti.`
        });
        await transaction.save();
  
        return res.json({ message: 'Payment verified and credits updated', credits: user.timeCredits });
      } else {
        return res.status(400).json({ message: 'Payment verification failed', details: responseData });
      }
    } catch (error) {
      console.error("Verification Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
  };
  
  module.exports = {verifyTransaction}