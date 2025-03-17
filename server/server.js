const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
const authRoutes = require("./routes/routes"); 
const Message = require("./models/Message");
require("dotenv").config();

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set("io", io);
const users = new Map();

global.io = io;
io.on('connection', (socket) => {
  console.log('user connected :', socket.id);

  socket.on("joinRoom", ({ userId }) => {
    if (!userId) {
      console.error("Missing userId in joinRoom event");
      return;
    }
    socket.join(userId.toString());
    users.set(userId.toString(), socket.id);
    console.log(`User ${userId} joined room`);
  });

  socket.on("chatMessage", async ({ sender, receiver, content }) => {
    if (!sender || !receiver || !content.trim()) {
      console.error("Invalid message data received:", { sender, receiver, content });
      return;
    }
    try {
      const message = new Message({
        sender,
        receiver,
        content: content.trim(),
        createdAt: new Date(),
      });

      await message.save();

      io.to(sender.toString()).emit("chatMessage", message);
      io.to(receiver.toString()).emit("chatMessage", message);

      console.log(`Message sent from ${sender} to ${receiver}: ${content}`);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("sendNotification", async ({ userId, message }) => {
    if (!userId || !message) {
      console.error("Invalid notification data:", { userId, message });
      return;
    }
    
    try {
      const notification = new Notification({
        userId,
        message,
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
module.exports = { io };