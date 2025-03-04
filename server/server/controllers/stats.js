const User = require('../models/User');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction'); 

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    res.status(200).json({
      totalUsers,
      totalServices,
      totalTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

module.exports = { getStats };
