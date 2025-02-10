const bcrypt = require("bcryptjs");
const User = require("../models/User");

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
  
    try {
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isMatch = await bcrypt.compare(oldPassword, req.user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      req.user.password = hashedPassword;
      await req.user.save();
  
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  };

module.exports = {changePassword};