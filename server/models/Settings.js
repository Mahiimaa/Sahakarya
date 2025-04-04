const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "Time Banking Platform" },
  siteDescription: { type: String, default: "" },
  adminEmail: { type: String, default: "" },
  emailNotifications: { type: Boolean, default: true },
  systemNotifications: { type: Boolean, default: true },
  defaultTimeCredits: { type: Number, default: 5 },
  requireEmailVerification: { type: Boolean, default: true },
  sessionTimeout: { type: Number, default: 60 },
  maxLoginAttempts: { type: Number, default: 5 },
  pricePerCredit: { type: Number, default: 1 },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: "We are currently undergoing maintenance. Please check back later."
  }
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
