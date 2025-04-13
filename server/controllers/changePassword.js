const bcrypt = require("bcryptjs");
const User = require("../models/User");

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
  
    try {
      const user = req.user;
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.passwordWasGenerated) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
    }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.passwordWasGenerated = false; 
      await user.save();
    
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  };

module.exports = {changePassword};