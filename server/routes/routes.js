const express = require("express");
const router = express.Router();
const { login, signup, requestOTP, submitOTP, resetPassword, logout } = require('../controllers/authController');
const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", signup);
router.post("/login", login);

router.post('/requestOTP', requestOTP);
router.post('/submitOTP', submitOTP);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

module.exports = router;