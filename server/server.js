const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true, 
  })
);
app.use(bodyParser.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/Sahakarya", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);


const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, "your_secret_key");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};


app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: "User Registered Successfully" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: "Invalid Password" });

  const token = jwt.sign({ _id: user._id }, "your_secret_key", { expiresIn: "1h" });
  res.json({ token });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

let activeOtpRequests = {}; 


app.post("/api/requestOTP", async (req, res) => {
  const { email } = req.body;

  try {
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const otp = crypto.randomBytes(2).toString("hex"); 
 
    activeOtpRequests[email] = {
      otp,
      createdAt: Date.now(),
    };

  
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP to reset your password is: ${otp}. It expires in 1 minute.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ error: "Error sending OTP" });
      }
      res.status(200).json({ message: "OTP sent to your email" });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/submitOTP", async (req, res) => {
  const { email, otp } = req.body;

  try {

    const otpRequest = activeOtpRequests[email];

    if (!otpRequest) {
      return res.status(400).json({ error: "OTP request not found" });
    }

    if (Date.now() - otpRequest.createdAt > process.env.OTP_EXPIRY_TIME) {
      delete activeOtpRequests[email];
      return res.status(400).json({ error: "OTP expired" });
    }


    if (otp !== otpRequest.otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    delete activeOtpRequests[email];

    res.status(200).json({ message: "OTP verified. Proceed to reset password." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});



app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});


// Start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
