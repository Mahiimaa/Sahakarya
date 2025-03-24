const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  type: { type: String, enum: ['request', 'chat', 'booking', 'mediation'], required: true },
  data: {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
