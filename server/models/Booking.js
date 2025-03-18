const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending","scheduled", "completed", "rejected", "credit transferred", "awaiting requester confirmation", ], default: "pending" },
  dateRequested: { type: Date, default: Date.now },
  scheduleDate: { type: Date },
  serviceDuration: { type: Number }, 
  confirmedByRequester: { type: Boolean, default: false },
  confirmedByProvider: { type: Boolean, default: false },
  actualDuration: { type: Number }, 
  proposedCredits: { type: Number }, 
  completionNotes:{type: String},
  disputeReason: {type: String},
  completedAt: { type: Date },
  reviewed: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
