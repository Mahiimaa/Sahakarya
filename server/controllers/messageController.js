const Message = require('../models/Message');

const getMessages = async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.providerId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: providerId },
        { sender: providerId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

const sendMessage = async (req, res, io) => {
  const { providerId, content } = req.body;
  const senderId = req.user.id;

  try {
    const message = new Message({
      sender: senderId,
      receiver: providerId,
      content,
      createdAt: new Date(),
    });

    await message.save();

    io.to(providerId).emit("chat message", message);
    io.to(senderId).emit("chat message", message);

    res.status(200).json({ message: 'Message sent successfully', message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

const getUserChats = async (req, res) => {
  const userId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: -1 });

    const chatUsers = new Set();
    messages.forEach((msg) => {
      chatUsers.add(msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString());
    });

    res.status(200).json({ chatUsers: Array.from(chatUsers) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error: error.message });
  }
};


module.exports = { getMessages, sendMessage, getUserChats };
