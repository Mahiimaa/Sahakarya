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

const sendMessage = async (req, res) => {
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

    res.status(200).json({ message: 'Message sent successfully', message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

module.exports = { getMessages, sendMessage };
