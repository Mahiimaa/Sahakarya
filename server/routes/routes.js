const express = require("express");
const router = express.Router();
const { login, signup, verifyEmail, resendVerification,  logout } = require('../controllers/authController');
const{requestOTP, submitOTP, resetPassword} = require('../controllers/forgotPassword');
const { addCategory, getCategories, deleteCategory, editCategory } = require('../controllers/category');
const {addService,editService,deleteService,getServices,selectService, addServiceOfferDetails, getPopularServices} = require('../controllers/service');
const { getStats } = require('../controllers/stats');
const {getAllUsers, deleteUser, assignRole, getUserDetails, getUserById} = require('../controllers/user');
const {changePassword} = require('../controllers/changePassword');
const {editProfile} = require('../controllers/profile');
const {
  initiatePayment,
  verifyPayment,
  handlePaymentCallback
} = require("../controllers/Payment");
const { getServiceDetails, getServiceById, getUserServices, updateServiceDetails, deleteUserService, getAllServiceDetails} = require('../controllers/serviceDetails');
const {getProviderDetails, getPreviousWork, addReviews, getReviewsByProvider, getReviewsByBooking, checkReviewExists, editReview, deleteReview, getTopRatedProviders} = require('../controllers/ProviderController');
const { requestService, getUserBookings, acceptServiceRequest, getServiceRequestsForProvider, getOutgoingBookings, rejectServiceRequest, submitProviderCompletion, disputeCompletion, confirmServiceCompletion } = require("../controllers/bookingController");
const { getMessages, sendMessage, markMessagesAsRead, getUserChats} = require('../controllers/messageController');
const {getNotifications,markAllAsRead, deleteNotification, deleteAllRead, readNotifications} = require('../controllers/notificationController');
const {requestMediation, getMediationCases, getMediationCaseDetails, sendMediationMessage, resolveMediation, getMediationMessages, getResolvedMediationCases} = require("../controllers/mediationController");
const {getTransactions, getTransactionById, getTransactionStats} = require('../controllers/transactionController');
const {getAllTransactions, getTransactionsById} = require('../controllers/AdminTransactions');
const {createServiceRequest, getAllServiceRequests } = require('../controllers/ServiceRequest');
const {getSettings, updateSettings} = require("../controllers/settingsController");
const { requestCashout, updateTransactionStatus, getCashoutStatus} = require('../controllers/cashout');
const {getMonthlyTrends, getServiceCategories, getRecentTransactions} = require("../controllers/adminDashboard")
const {getSuggestions} = require("./address");
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
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.post('/requestOTP',verifyToken, requestOTP);
router.post('/submitOTP',verifyToken, submitOTP);
router.post('/resetPassword',verifyToken, resetPassword);
router.post('/logout',verifyToken, logout);

router.post('/admin/category',[verifyToken, authorizeRoles("admin")], addCategory);
router.get('/category',verifyToken, getCategories);
router.delete('/admin/category/:id',[verifyToken, authorizeRoles("admin")], deleteCategory);
router.put('/admin/category/:id',[verifyToken, authorizeRoles("admin")], editCategory )

router.post('/admin/service', [verifyToken, authorizeRoles("admin")], addService); 
router.put('/admin/service/:id',[verifyToken, authorizeRoles("admin")], editService); 
router.delete('/admin/service/:id',[verifyToken, authorizeRoles("admin")], deleteService);

// User Routes
router.get('/services',verifyToken, getServices); 
router.post('/services/select',verifyToken, selectService);

router.get('/stats',verifyToken, getStats);
router.get('/users',verifyToken, getAllUsers);
router.delete('/deleteUser/:id',[verifyToken, authorizeRoles("admin")], deleteUser);
router.post('/assignRole', assignRole);

router.get('/user/me', verifyToken,  getUserDetails);
router.get("/users/:id", verifyToken, getUserById);
router.put('/changePassword', verifyToken, changePassword);
router.put('/editProfile', verifyToken, upload.single('profilePicture'), editProfile);
router.get("/services/popular", verifyToken, getPopularServices);
router.post("/user/services/:serviceId", verifyToken, upload.single("image"), addServiceOfferDetails);
router.get('/services/:id',verifyToken, getServiceDetails);
router.get('/allServices',verifyToken, getAllServiceDetails);
router.put("/user/services/:serviceId", verifyToken, upload.single("image"), updateServiceDetails);
router.delete("/user/services/:serviceId", verifyToken, deleteUserService);
router.get("/providers/top-rated", verifyToken, getTopRatedProviders);
router.get("/providers/:providerId", verifyToken, getProviderDetails);
router.get("/:providerId/previous-work", verifyToken, getPreviousWork);
router.post("/reviews", verifyToken, addReviews);
router.get('/reviews/provider/:providerId', verifyToken , getReviewsByProvider);
router.get('/reviews/booking/:bookingId', verifyToken, getReviewsByBooking);
router.get('/reviews/exists/:bookingId', verifyToken, checkReviewExists);
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
router.put('/bookings/:bookingId/dispute', verifyToken, disputeCompletion);
router.put('/bookings/:bookingId/provider-completion', verifyToken, submitProviderCompletion);

router.put("/:bookingId/confirm",verifyToken, confirmServiceCompletion);
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
router.post("/payment/initiate", verifyToken, initiatePayment);
router.post("/payment/verify", verifyToken, verifyPayment);
router.get("/payment/callback", handlePaymentCallback);

router.get("/notifications", verifyToken, getNotifications );
router.put("/notifications/mark-read/:notificationId", verifyToken, readNotifications);
router.put("/read-all", verifyToken, markAllAsRead);
router.delete("/:notificationId", verifyToken, deleteNotification);
router.delete("/delete-read",verifyToken, deleteAllRead);
router.get('/transactions', verifyToken, getTransactions);
router.get('/transactions/:id', verifyToken, getTransactionById);
router.get('/stats', verifyToken, getTransactionStats);

router.post('/bookings/:bookingId/mediation', verifyToken, requestMediation);
router.get('/mediation/cases', [verifyToken, authorizeRoles("admin")], getMediationCases);
router.get('/mediation/cases/:caseId', [verifyToken, authorizeRoles("admin")], getMediationCaseDetails);
router.post('/bookings/:bookingId/mediation-messages', verifyToken, sendMediationMessage);
router.get('/bookings/:bookingId/mediation-messages', verifyToken, getMediationMessages);
router.post('/mediation/:caseId/resolve',[verifyToken, authorizeRoles("admin")], resolveMediation);
router.get('/mediation/resolved-cases', verifyToken, getResolvedMediationCases);


router.post('/service-requests', verifyToken, createServiceRequest);
router.get('/admin/service-requests', verifyToken, getAllServiceRequests);

router.post('/cashout/request', verifyToken, requestCashout);
router.get('/admin/Transactions',  verifyToken, getAllTransactions);
router.patch('/transactions/:id/status', [verifyToken, authorizeRoles("admin")], updateTransactionStatus);
router.get('/status/:id', verifyToken, getCashoutStatus);

router.get('/adminTransactionsById', 
  verifyToken, getTransactionById);

router.get('/monthly-trends', verifyToken, getMonthlyTrends);
router.get('/service-categories', verifyToken, getServiceCategories);
router.get('/recent-transactions', verifyToken, getRecentTransactions);

router.get("/settings", verifyToken, getSettings);
router.put("/admin/settings", [verifyToken, authorizeRoles("admin")], updateSettings);

router.get('/address/suggestions',verifyToken, getSuggestions);

module.exports = router;