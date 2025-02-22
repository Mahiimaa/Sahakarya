const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  type: String, // e.g., 'purchase', 'earned', 'spent'
  date: { type: Date, default: Date.now },
  details: String,
});

module.exports = mongoose.model('Transaction', transactionSchema);