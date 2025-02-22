const express = require("express");
const router = express.Router();
const { login, signup,  logout } = require('../controllers/authController');
const{requestOTP, submitOTP, resetPassword} = require('../controllers/forgotPassword');
const { addCategory, getCategories, deleteCategory } = require('../controllers/category');
const {addService,editService,deleteService,getServices,selectService,} = require('../controllers/service');
const { getStats } = require('../controllers/stats');
const {getAllUsers, deleteUser, assignRole, getUserDetails} = require('../controllers/user');
const {changePassword} = require('../controllers/changePassword');
const {editProfile} = require('../controllers/profile');
const { getServiceDetails } = require('../controllers/serviceDetails');
const { getMessages, sendMessage, markMessagesAsRead, getUserChats} = require('../controllers/messageController');
const multer = require('multer');
const path = require('path');
const { verifyToken, authorizeRoles } = require("../middleware/authmiddleware");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + ext);
    }
  });
  
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 
    },
    fileFilter: fileFilter
  });

router.post("/signup", signup);
router.post("/login", login);

router.post('/requestOTP', requestOTP);
router.post('/submitOTP', submitOTP);
router.post('/resetPassword', resetPassword);
router.post('/logout', logout);

router.post('/admin/category', addCategory);
router.get('/category', getCategories);
router.delete('/admin/category/:id', deleteCategory);

router.post('/admin/service', addService); 
router.put('/admin/service/:id', editService); 
router.delete('/admin/service/:id', deleteService);

// User Routes
router.get('/services', getServices); 
router.post('/services/select', selectService);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/deleteUser/:id', deleteUser);
router.post('/assignRole', assignRole);

router.get('/user/me', verifyToken,  getUserDetails);
router.put('/changePassword', verifyToken, changePassword);
router.put('/editProfile', verifyToken, upload.single('profilePicture'), editProfile);
router.get('/services/:id', getServiceDetails);
router.post("/sendMessage", verifyToken, (req, res) => {
  const io = req.app.get('io');
  sendMessage(req, res, io);
});
router.get("/messages/:providerId", verifyToken, getMessages);
router.put("/messages/:providerId/read", verifyToken, (req, res) => {
  const io = req.app.get('io');
  markMessagesAsRead(req, res, io);
});
router.get("/chats", verifyToken, getUserChats);

module.exports = router;