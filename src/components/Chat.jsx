import React, { useState, useEffect, useRef } from "react";
import {io} from 'socket.io-client';
import axios from "axios";
import { IoClose } from "react-icons/io5";
const socket = io("ws://localhost:5000", { transports: ["websocket", "polling"] , autoConnect: false,  withCredentials: true,});
const Chat = ({ onClose, provider, requester}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User Data:", data.id);
        setUserId(data.id);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, [token, apiUrl]);

  useEffect (() => {
    if (!userId || !provider?._id || !requester?._id) return;
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/messages/${provider._id}/${requester._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMessages(data.messages);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [userId, provider?._id, requester?._id, token, apiUrl]);
  

  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) {
      socket.connect();
      socket.emit("joinRoom", { userId });
    }

    const handleIncomingMessage = (msg) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((m) => m._id === msg._id);
        return messageExists ? prevMessages : [...prevMessages, msg];
      });
        scrollToBottom();
      };
  return () => {
    socket.off("chatMessage", handleIncomingMessage);
  };
}, [userId]);
  
useEffect(() => {
  scrollToBottom();
}, [messages]);

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim()) return;
  const receiverId = String(userId) === String(provider._id) ? requester._id : provider._id;

    const msg = {
      providerId: provider._id,
      requesterId:requester._id,
      receiver: receiverId,
      content: newMessage.trim(),
      sender:userId,
    };
    try {
      const { data } = await axios.post(`${apiUrl}/api/sendMessage`, msg, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
      });    
      if(data?.data) {
        setMessages((prevMessages) => [...prevMessages, data.data]); 
        socket.emit("chatMessage", data.data);
        scrollToBottom();  
      }
      setNewMessage(""); 
  }
  catch (error) {
    console.error("Error sending message:", error);
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
      <div className="bg-white w-1/3 p-4 rounded-lg shadow-lg relative">
        <button className="absolute top-2 right-2 text-grey" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <h2 className="text-lg font-bold mb-4">Chat with {provider.username}</h2>
        <div className="h-96 overflow-y-auto border p-2 mb-2 flex flex-col">
          {messages.map((msg, index) => {
           const isSentByUser = userId && msg.sender && 
           (String(msg.sender) === String(userId) || 
            (typeof msg.sender === 'object' && msg.sender._id && String(msg.sender._id) === String(userId)));
        return (
            <div
              key={msg._id || index} className={`flex ${isSentByUser ? "justify-end" : "justify-start"}`}>
                <div
              className={`p-3 my-1 rounded-lg max-w-[75%] text-body shadow ${
                isSentByUser    ? "bg-p text-white rounded-br-none"
                : "bg-dark-grey rounded-bl-none"
            }`}
            >
               <div className="break-words">{msg.content}</div>
               <div className="text-body mt-1 text-white opacity-70 text-right">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
            </div>
            </div>
          );
})}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2 p-2 border-t bg-white">
          <input
            type="text"
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-p"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          />
          <button type="submit" className="bg-p text-white px-4 py-2 rounded disabled:opacity-50 " disabled={!newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;