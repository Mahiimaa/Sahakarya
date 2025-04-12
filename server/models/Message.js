const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default:"",
  },
  imageUrl: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: { type: Boolean, default: false }, 
    readAt: { type: Date } 
});

module.exports = mongoose.model('Message', messageSchema);
