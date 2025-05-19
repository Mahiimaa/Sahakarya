const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
const authRoutes = require("./routes/routes"); 
const Message = require("./models/Message");
const Mediation = require('./models/Mediation');
const Booking = require("./models/Booking");
const User = require("./models/User");
require("dotenv").config();
const Notification = require("./models/Notification");

const app = express();
// app.set('io', io);
const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  }
});
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set("io", io);
const users = new Map();

global.io = io;

const getRoomId = (providerId, requesterId) => {
  return [providerId, requesterId].sort().join('_');
};
io.on('connection', (socket) => {
  console.log('user connected :', socket.id);

  socket.on("joinRoom", ({ roomId, userId }) => {
    console.log(`User ${userId} attempting to join room ${roomId}`);
    if (!roomId || !userId) {
      console.error("Missing userId in joinRoom event", { roomId, userId });
      return;
    }
    socket.join(roomId.toString());
    users.set(userId.toString(), socket.id);
    console.log(`User ${userId} joined room ${roomId} `);
  });

  socket.on('leaveRoom', ({ roomId, userId }) => {
    if (!roomId || !userId) {
      console.error('Missing roomId or userId in leaveRoom event', { roomId, userId });
      return;
    }
    socket.leave(roomId.toString());
    console.log(`User ${userId} left room ${roomId}`);
  });

  socket.on("chatMessage", async (msg, callback) => {
    const { roomId, sender, receiver, content, providerId, requesterId, imageUrl } = msg;
    const computedRoomId = getRoomId(providerId, requesterId);
    if (roomId !== computedRoomId) {
      console.error("Room ID mismatch:", { received: roomId, expected: computedRoomId });
      if (callback) callback({ error: "Invalid room ID" });
      return;
    }
    if (!sender || !receiver || (!content && !imageUrl) || !providerId || !requesterId) {
      console.error("Invalid message data received:", msg);
      if (callback) callback({ error: "Invalid message data" });
      return;
    }
    try {
      const existingMessage = await Message.findOne({
        sender,
        receiver,
        content,
        createdAt: { $gte: new Date(Date.now() - 1000) },
      });
      if (existingMessage) {
        console.log(`Duplicate message detected, ID: ${existingMessage._id}`);
        if (callback) callback(existingMessage);
        return;
      }

      const message = new Message({
        sender,
        receiver,
        providerId,
        requesterId,
        content: content ? content.trim() : undefined,
        imageUrl,
        createdAt: new Date(),
      });

      await message.save();

      io.to(computedRoomId.toString()).emit("chatMessage", message);
      console.log(`Emitted chatMessage to room ${computedRoomId}, message ID: ${message._id}`);
      if (callback) callback(message);

      const senderUser = await mongoose.model('User').findById(sender);
      const senderName = senderUser ? senderUser.username : 'Someone';

        const notification = new Notification({
          userId: receiver,
          message: `New message from ${senderName}: ${content.substring(0, 30)}${content.length > 30 ? "..." : ""}`,
          type: 'chat',
          data: {
            senderId: sender
          },
          isRead: false,
          createdAt: new Date()
        });
        
        await notification.save();
        io.to(receiver.toString()).emit("newNotification", notification);
  
      console.log(`Message sent in room ${roomId} from ${sender} to ${receiver}: ${content}`);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on(
    "mediationMessage",
    async ({ caseId, message, sender, senderName, isFromMediator, _id, timestamp }) => {
      console.log(
        `Received mediationMessage for room ${caseId}, message: ${message}`
      );
      if (!caseId || !message || !sender || !senderName || !_id) {
        console.error("Invalid mediation message data:", {
          caseId,
          message,
          sender,
          senderName,
          _id,
        });
        return;
      }
      try {
        const messageToEmit = {
          caseId,
          message: message.trim(),
          sender,
          senderName,
          isFromMediator,
          _id,
          timestamp: new Date(timestamp).toISOString(),
        };
        console.log(`Emitting mediationMessage to room ${caseId}`);
        io.to(caseId.toString()).emit("mediationMessage", messageToEmit);
        console.log(`Mediation message sent to room ${caseId}: ${message}`);
      } catch (error) {
        console.error("Error broadcasting mediation message:", error);
      }
    }
  );

  socket.on("sendNotification", async ({ userId, message, type, data}) => {
    if (!userId || !message) {
      console.error("Invalid notification data:", { userId, message, type, data });
      return;
    }
    
    try {
      const notification = new Notification({
        userId,
        message,
        type: type || 'general',
        data: data || {}, 
        isRead: false,
        createdAt: new Date(),
      });
      await notification.save();
      console.log(`Emitting newNotification event to userId: ${userId}`);
      io.to(userId.toString()).emit("newNotification", notification);
      console.log(`Notification sent to ${userId}: ${message}`);
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    users.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        users.delete(userId);
      }
    });
  });
});

mongoose.connect("mongodb://127.0.0.1:27017/Sahakarya", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB Connection Error:", err));

app.use("/api", authRoutes); 

if (process.env.NODE_ENV !== 'test') {
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = { app, server, io };