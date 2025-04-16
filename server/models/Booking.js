const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending","scheduled", "completed", "rejected", "credit transferred", "awaiting requester confirmation", 'disputed',                    // Add this
      'in mediation',                
      'mediation resolved' ], default: "pending" },
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
  disputeReason: {
    type: String,
    default: ''
  },
  mediationRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mediationRequestedAt: {
    type: Date
  },
  mediationAdditionalInfo: {
    type: String,
    default: ''
  },
  mediationStatus: {
    type: String,
    enum: ['pending', 'in progress', 'resolved'],
    default: 'pending'
  },
  mediationResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mediationResolvedAt: {
    type: Date
  },
  mediationDecision: {
    type: String,
    default: ''
  },
  finaltimeCredits: {
    type: Number
  },
  heldCredits: {
    type: Number,
    default: 0
  },
  creditTransferred: {
    type: Boolean,
    default: false
  },
  serviceDetailSnapshot: {
    title: { type: String },
    description: { type: String },
    duration: { type: Number },
    timeCredits: { type: Number },
    image: { type: String }
  },
  
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
