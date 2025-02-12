const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');

const editProfile = async (req, res) => {
  try {
    const { name, email, phone, services } = req.body;
    const userId = req.user.id; 

    const selectedServices = Array.isArray(services) ? services : JSON.parse(services || "[]");

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.services = selectedServices;
    
    if (req.file) {
      if (user.profilePicture) {
        const oldFilePath = path.join(__dirname, '..', user.profilePicture);
        try {
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.warn('Failed to delete old profile picture:', err);
        }
      }
      user.profilePicture = `/uploads/${req.file.filename}`;
    }
    await user.save();

    res.json({ message: "Profile updated successfully!", user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

module.exports = {
  editProfile,
};