const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getMessages = async (req, res) => {
  const userId = req.user._id;
  const providerId = req.params.providerId;
  const requesterId = req.params.requesterId;

  if (!isValidObjectId(providerId)|| !isValidObjectId(requesterId)) {
    return res.status(400).json({ message: 'Invalid provider ID format' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: providerId, receiver: requesterId },
        { sender: requesterId, receiver: providerId },
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
  const { providerId, requesterId, content } = req.body;
  const senderId = req.user._id;
  console.log("Received Message Request:", { providerId, requesterId, content, senderId });
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  if (!isValidObjectId(providerId)|| !isValidObjectId(requesterId)){
    return res.status(400).json({ message: 'Invalid provider ID format' });
  }
  const receiverId = senderId.toString() === providerId.toString() ? requesterId : providerId;
  try {
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      createdAt: new Date(),
    });

    console.log(`Sending message from ${senderId} to ${receiverId}`);

    if (global.io) {
      global.io.to(senderId.toString()).emit("chat message", message);
      global.io.to(receiverId.toString()).emit("chat message", message);
    } else {
      console.warn("Socket.io is not initialized yet.");
    }
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
  try {
    const userId = req.user._id;
    console.log("Fetching chats for user:", userId);
    const currentUser = await User.findById(userId, 'username email profilePicture');
    if (!currentUser) {
      console.error("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: new mongoose.Types.ObjectId(userId) }, 
            { receiver: new mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
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
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
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
        $unwind: "$user", 
      },
      {
        $project: {
          "user._id": 1,
          "user.username": 1,
          "user.profilePicture": 1, 
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.status(200).json({ 
      chats: latestMessages,
      currentUser: {
      _id: userId,
      username: currentUser.username,
      profilePicture: currentUser.profilePicture,
    } });
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