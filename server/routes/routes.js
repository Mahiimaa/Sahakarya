const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const forgotPassword = require("../controllers/forgotPassword");
const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/role/addUser", userController.addUser);

router.post("/requestOTP", forgotPassword.requestOTP);
router.post("/submitOTP", forgotPassword.checkOTP);
router.post("/changePassword", forgotPassword.changePassword);

module.exports = router;