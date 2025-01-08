const User = require("../models/User");
const transporter = require("../config/nodeMailerConfig");
const bcrypt = require("bcrypt");

const requestOTP = async (req, res) => {
  const { email } = req.body;

  // Input validation
  if (!email || !email.trim()) {
    return res.status(400).json({ 
      success: false,
      message: "Email is required" 
    });
  }

  try {
    // Find user with email
    const user = await User.findOne({ email }).exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist"
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Update user with new OTP
    user.otp = hashedOtp;
    user.otpCreatedAt = new Date(); // Add timestamp for additional security
    await user.save();

    // Prepare email
    const mailOptions = {
      to: email,
      subject: "Important: Your Verification Code",
      text: `Your verification code is: ${otp}\n\nThis code will expire in 1 minute.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <h2>Your Verification Code</h2>
        <p>Here is your verification code:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background-color: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
        <p>This code will expire in 1 minute.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Set up OTP expiration
    const clearOTP = async () => {
      try {
        const userToUpdate = await User.findOne({ email }).exec();
        if (userToUpdate && userToUpdate.otp) {
          userToUpdate.otp = null;
          userToUpdate.otpCreatedAt = null;
          await userToUpdate.save();
          console.log(`OTP cleared for user ${email}`);
        }
      } catch (error) {
        console.error(`Error clearing OTP for user ${email}:`, error);
      }
    };

    // Schedule OTP clearance
    setTimeout(clearOTP, 60000);

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully. Please check your email.",
      expiresIn: 60 // seconds
    });

  } catch (error) {
    console.error("OTP Request Error:", {
      error: error.message,
      stack: error.stack,
      email: email
    });

    // Determine appropriate error response
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        success: false,
        message: "Database error occurred. Please try again later."
      });
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        success: false,
        message: "Email service is currently unavailable. Please try again later."
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later."
    });
  }
};

module.exports = { requestOTP };