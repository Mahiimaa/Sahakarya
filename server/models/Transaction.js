const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, 
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Card', 'Cash', 'Bank Transfer', 'Other'], required: true }, 
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }, 
  createdAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Transaction', transactionSchema);