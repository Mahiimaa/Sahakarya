const express = require("express");
const router = express.Router();
const { login, signup,  logout } = require('../controllers/authController');
const{requestOTP, submitOTP, resetPassword} = require('../controllers/forgotPassword');
const { addCategory, getCategories, deleteCategory } = require('../controllers/category');
const {addService,editService,deleteService,getServices,selectService,} = require('../controllers/service');
const { getStats } = require('../controllers/stats');
const authMiddleware = require("../middleware/authmiddleware");

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

module.exports = router;