const Settings = require("../models/Settings");

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const fields = [
      "siteName",
      "siteDescription",
      "adminEmail",
      "emailNotifications",
      "systemNotifications",
      "defaultTimeCredits",
      "requireEmailVerification",
      "sessionTimeout",
      "maxLoginAttempts",
      "pricePerCredit",
      "maintenanceMode", "maintenanceMessage"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    
    if (req.body.pricePerCredit !== undefined) {
      const price = parseFloat(req.body.pricePerCredit);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "Price per credit must be a positive number" });
      }
      settings.pricePerCredit = price;
    }
    await settings.save();
    res.json({ success: true, message: "Settings updated", settings });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

module.exports ={getSettings, updateSettings};