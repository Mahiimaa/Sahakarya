const express = require("express");
const router = express.Router();
const { login, signup,  logout } = require('../controllers/authController');
const{requestOTP, submitOTP, resetPassword} = require('../controllers/forgotPassword');
const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", signup);
router.post("/login", login);

router.post('/requestOTP', requestOTP);
router.post('/submitOTP', submitOTP);
router.post('/resetPassword', resetPassword);
router.post('/logout', logout);

module.exports = router;