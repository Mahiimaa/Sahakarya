const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getAllTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'All') {
      filter.status = { $regex: status, $options: 'i' };
    }
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const transactions = await Transaction.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipientDetails'
        }
      },
      {
        $unwind: {
          path: '$senderDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$recipientDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      { $match: filter },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          transactionId: 1,
          type: 1,
          amount: 1,
          creditAmount: 1,
          status: 1,
          details: 1,
          createdAt: 1,
          sender: {
            _id: '$senderDetails._id',
            username: '$senderDetails.username',
            name: '$senderDetails.name',
            email: '$senderDetails.email'
          },
          recipient: {
            _id: '$recipientDetails._id',
            username: '$recipientDetails.username',
            name: '$recipientDetails.name',
            email: '$recipientDetails.email'
          }
        }
      }
    ]);
    const total = await Transaction.countDocuments(filter);
    console.log('Transactions Response:', {
      transactionsCount: transactions.length,
      total,
      firstTransaction: transactions[0]
    });

    res.json({
      transactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transactions', 
      error: error.message 
    });
  }
};

const getTransactionsById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('sender', 'username name email')
      .populate('recipient', 'username name email')
      .lean();

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transaction details', 
      error: error.message 
    });
  }
};

module.exports = { 
  getAllTransactions, 
  getTransactionsById 
};