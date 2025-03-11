const express = require("express");
const router = express.Router();
const { login, signup,  logout } = require('../controllers/authController');
const{requestOTP, submitOTP, resetPassword} = require('../controllers/forgotPassword');
const { addCategory, getCategories, deleteCategory } = require('../controllers/category');
const {addService,editService,deleteService,getServices,selectService, addServiceOfferDetails} = require('../controllers/service');
const { getStats } = require('../controllers/stats');
const {getAllUsers, deleteUser, assignRole, getUserDetails} = require('../controllers/user');
const {changePassword} = require('../controllers/changePassword');
const {editProfile} = require('../controllers/profile');
const {verifyTransaction, getTransactions} = require('../controllers/transactionController');
const { getServiceDetails, getServiceById, getUserServices, updateServiceDetails, deleteUserService, getAllServiceDetails} = require('../controllers/serviceDetails');
const {getProviderDetails, getPreviousWork, addReviews, editReview, deleteReview} = require('../controllers/ProviderController');
const { requestService, getUserBookings, acceptServiceRequest, getServiceRequestsForProvider, getOutgoingBookings, rejectServiceRequest, confirmServiceCompletion } = require("../controllers/bookingController");
const { getMessages, sendMessage, markMessagesAsRead, getUserChats} = require('../controllers/messageController');
const {transferTimeCredit} = require('../controllers/timeCreditController');
const multer = require('multer');
const path = require('path');
const { verifyToken, authorizeRoles } = require("../middleware/authmiddleware");
const { verify } = require("crypto");

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
      fileSize: 20 * 1024 * 1024 
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
router.post("/user/services/:serviceId", verifyToken, upload.single("image"), addServiceOfferDetails);
router.get('/services/:id',verifyToken, getServiceDetails);
router.get('/allServices',verifyToken, getAllServiceDetails);
router.put("/user/services/:serviceId", verifyToken, upload.single("image"), updateServiceDetails);
router.delete("/user/services/:serviceId", verifyToken, deleteUserService);
router.get("/providers/:providerId", verifyToken, getProviderDetails);
router.get("/:providerId/previous-work", verifyToken, getPreviousWork);
router.post("/reviews", verifyToken, addReviews);
router.put("/reviews/:reviewId", verifyToken, editReview);
router.delete("/reviews/:reviewId", verifyToken, deleteReview);
router.get ('/serviceId', getServiceById);
router.get("/bookings/user", verifyToken, getUserBookings);
router.get("/my-services", verifyToken, getUserServices);
router.post("/bookings", verifyToken, requestService);
router.get("/bookings/provider", verifyToken, getServiceRequestsForProvider);
router.get("/bookings/requester", verifyToken, getOutgoingBookings);
router.put("/:bookingId/accept", verifyToken, acceptServiceRequest);
router.put("/:bookingId/reject", verifyToken, rejectServiceRequest);
router.put("/:bookingId/confirm",verifyToken, confirmServiceCompletion);
router.post('/verify',verifyToken, verifyTransaction);
router.post("/sendMessage", verifyToken, (req, res) => {
  const io = req.app.get('io');
  sendMessage(req, res, io);
});
router.get("/messages/:providerId/:requesterId", verifyToken, getMessages);
router.put("/messages/:providerId/read", verifyToken, (req, res) => {
  const io = req.app.get('io');
  markMessagesAsRead(req, res, io);
});
router.get("/chats", verifyToken, getUserChats);

router.put('/bookings/:bookingId/transfer-credits', verifyToken, transferTimeCredit);
router.get('/transactions', verifyToken, getTransactions);

module.exports = router;