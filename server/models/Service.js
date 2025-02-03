const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  selectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Service', serviceSchema);