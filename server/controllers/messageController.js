const Message = require('../models/Message');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getMessages = async (req, res) => {
  const userId = req.user._id;
  const providerId = req.params.providerId;

  if (!isValidObjectId(providerId)) {
    return res.status(400).json({ message: 'Invalid provider ID format' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: providerId },
        { sender: providerId, receiver: userId },
      ],
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username') 
    .populate('receiver', 'username')
    .lean(); 

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ 
      message: 'Error fetching messages', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

const sendMessage = async (req, res, io) => {
  const { providerId, content } = req.body;
  const senderId = req.user._id;
  console.log("Received Message Request:", { providerId, content, senderId });
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  if (!isValidObjectId(providerId)) {
    return res.status(400).json({ message: 'Invalid provider ID format' });
  }

  try {
    const message = new Message({
      sender: senderId,
      receiver: providerId,
      content: content.trim(),
      createdAt: new Date(),
    });

    await message.save();

    io.to(providerId.toString()).emit("chat message", message);
    io.to(senderId.toString()).emit("chat message", message);

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

const getUserChats = async (req, res) => {
  const userId = req.user._id;

  try {
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users', 
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          user: { $arrayElemAt: ['$user', 0] },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.status(200).json({ chats: latestMessages });
  } catch (error) {
    console.error('Error in getUserChats:', error);
    res.status(500).json({ 
      message: 'Error fetching chats', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  const userId = req.user._id;
  const providerId = req.params.providerId;

  if (!mongoose.Types.ObjectId.isValid(providerId)) {
    return res.status(400).json({ message: 'Invalid provider ID format' });
  }
  try {
    const result = await Message.updateMany(
      {
        sender: providerId,
        receiver: userId,
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    res.status(200).json({ 
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    res.status(500).json({ 
      message: 'Error marking messages as read', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

module.exports = { 
  getMessages, 
  sendMessage, 
  getUserChats,
  markMessagesAsRead
};