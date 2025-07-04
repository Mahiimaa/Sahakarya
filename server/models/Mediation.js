// models/MediationMessage.js

const mongoose = require('mongoose');

const MediationSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isFromMediator: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
MediationSchema.index({ booking: 1, sender: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('Mediation', MediationSchema);