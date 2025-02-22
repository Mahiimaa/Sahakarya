const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
const authRoutes = require("./routes/routes"); 
const Message = require("./models/Message");

const app = express();
app.set('io', io);
const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
io.on('connection', (socket) => {
  console.log('user connected', socket.id);

  socket.on("joinRoom", ({ userId }) => {
    if (!userId) {
      console.error("Missing userId in joinRoom event");
      return;
    }
    socket.join(userId.toString());
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

//   socket.on("chat message", async (msg) => {
//     if (msg._id) {
//       io.to(msg.receiver).emit("chat message", msg);
//       return;
//     }
//     const { sender, receiver, text } = msg;

//     try {
//       const message = new Message({
//         sender,
//         receiver,
//         content: text,
//         createdAt: new Date(),
//       });

//       await message.save();

//       io.to(receiver).emit("chat message", message);
//       socket.emit("chat message", message);
//     } catch (error) {
//       console.error("Error saving message:", error);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });


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