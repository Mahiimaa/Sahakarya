const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "completed", "rejected"], default: "pending" },
  dateRequested: { type: Date, default: Date.now },
  scheduleDate: { type: Date },
  serviceDuration: { type: Number }, 
  requesterConfirmed: { type: Boolean, default: false },
  providerConfirmed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
