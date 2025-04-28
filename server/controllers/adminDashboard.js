const User = require('../models/User');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

const inspectUserDocument = async () => {
  try {
    const user = await User.findOne().lean();
    console.log('User document structure:', JSON.stringify(user, null, 2));
    console.log('User date fields:', {
      createdAt: user.createdAt ? typeof user.createdAt : 'not present',
      creationDate: user.creationDate ? typeof user.creationDate : 'not present',
    });
  } catch (error) {
    console.error('Error inspecting user document:', error);
  }
};

const inspectServiceDocument = async () => {
  try {
    const service = await Service.findOne().lean();
    console.log('Service document structure:', JSON.stringify(service, null, 2));
    console.log('Service date fields:', {
      createdAt: service.createdAt ? typeof service.createdAt : 'not present',
      creationDate: service.creationDate ? typeof service.creationDate : 'not present',
    });
  } catch (error) {
    console.error('Error inspecting service document:', error);
  }
};


const inspectTransactionDocument = async () => {
  try {
    const transaction = await Transaction.findOne().lean();
    console.log('Transaction document structure:', JSON.stringify(transaction, null, 2));
    console.log('Transaction date fields:', {
      createdAt: transaction.createdAt ? typeof transaction.createdAt : 'not present',
      date: transaction.date ? typeof transaction.date : 'not present',
    });
  } catch (error) {
    console.error('Error inspecting transaction document:', error);
  }
};

const getMonthlyTrends =  async (req, res) => {
    try {
      await inspectUserDocument();
await inspectServiceDocument();
await inspectTransactionDocument();
      const currentDate = new Date();
      const monthsToShow = 6; 
      const result = [];
      
      for (let i = 0; i < monthsToShow; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthName = startOfMonth.toLocaleString('default', { month: 'short' });
        
        console.log(`Checking range for ${monthName}:`, {
          startOfMonth: startOfMonth.toISOString(),
          endOfMonth: endOfMonth.toISOString()
        });
        
        const userQuery = {
          $or: [
            { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
            { creationDate: { $gte: startOfMonth, $lte: endOfMonth } }
          ]
        };
        const newUsers = await User.countDocuments(userQuery);
        
        const serviceQuery = {
          $or: [
            { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
            { creationDate: { $gte: startOfMonth, $lte: endOfMonth } }
          ]
        };
        const newServices = await Service.countDocuments(serviceQuery);
        
        const transactionQuery = {
          $or: [
            { date: { $gte: startOfMonth, $lte: endOfMonth } },
            { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
          ]
        };
        const monthlyTransactions = await Transaction.countDocuments(transactionQuery);
        
        console.log(`Counts for ${monthName}:`, {
          users: newUsers,
          services: newServices,
          transactions: monthlyTransactions
        });
        result.unshift({
          month: monthName,
          users: newUsers,
          services: newServices,
          transactions: monthlyTransactions
        });
      }
      
      console.log('Monthly trend data:', result);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
const getServiceCategories = async (req, res) => {
    try{
      const categories = await Category.find().lean();
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category._id.toString()] = category.categoryName || 'Unknown';
    });
    
    console.log('Category mapping:', categoryMap);
    const services = await Service.find().lean();
    const categoryCounts = {};
    services.forEach(service => {
      const categoryId = service.category ? service.category.toString() : 'uncategorized';
      if (!categoryCounts[categoryId]) {
        categoryCounts[categoryId] = 0;
      }
      categoryCounts[categoryId]++;
    });
    
    console.log('Category counts:', categoryCounts);
    const result = [];
    
    for (const categoryId in categoryCounts) {
      const categoryName = categoryMap[categoryId] || (categoryId === 'uncategorized' ? 'Uncategorized' : categoryId);
      
      result.push({
        category: categoryName,
        value: categoryCounts[categoryId]
      });
    }
    
    console.log('Final formatted result:', result);
    
    res.json(result);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
const getRecentTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .sort({ date: -1 })
        .limit(10)
        // .populate('service', 'name')
        .lean();
        
        const formattedTransactions = transactions.map(transaction => ({
        id: transaction._id,
        serviceName: transaction.serviceName || 
                    (transaction.service && transaction.service.name) || 
                    (transaction.serviceId && transaction.serviceId.name) ||
                    "Service",
        amount: transaction.amount,
        date: transaction.date,
        status: transaction.status
      }));
      
      res.json(formattedTransactions);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

module.exports = {getMonthlyTrends, getServiceCategories, getRecentTransactions}