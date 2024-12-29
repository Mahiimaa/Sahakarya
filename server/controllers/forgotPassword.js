const User = require("../models/User"); // Adjust the path based on your folder structure
const transporter = require("../config/nodeMailerConfig");
const bcrypt = require("bcrypt");

const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User does not exist" });

    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    await user.save();

    await transporter.sendMail({
      to: email,
      subject: "Important: OTP Code for Verification",
      text: `Your OTP is ${otp}. It is valid for 1 minute.`,
    });

    setTimeout(async () => {
      console.log(`Clearing OTP for user ${email}`);
      try {
        const userToUpdate = await User.findOne({ email });
        if (userToUpdate) {
          userToUpdate.otp = null;
          await userToUpdate.save();
          console.log(`OTP cleared for user ${email}`);
        }
      } catch (updateError) {
        console.error(`Error clearing OTP for user ${email}:`, updateError);
      }
    }, 60000);

    res
      .status(200)
      .json({ message: "OTP sent to your email and will expire in 1 minute" });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res
      .status(500)
      .json({ message: "An error occurred while requesting OTP" });
  }
};

module.exports = { requestOTP, checkOTP, changePassword };
