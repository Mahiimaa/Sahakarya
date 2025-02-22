import React, { useState, useEffect, useRef } from "react";
import {io} from 'socket.io-client';
import axios from "axios";
import { IoClose } from "react-icons/io5";
const socket = io("ws://localhost:5000", { transports: ["websocket", "polling"] , autoConnect: false,  withCredentials: true,});
const Chat = ({ onClose, provider }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
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

  useEffect(() => {
    if (!userId) return;
    
    if (!socket.connected) {
      socket.connect();
      socket.emit("joinRoom", { userId });
    }
    markMessagesAsRead();
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  useEffect (() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/messages/${provider._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMessages(data.messages);
        await markMessagesAsRead();
      } catch (error) {
        setError("Failed to fetch messages");
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const handleIncomingMessage = (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    if (msg.sender !== userId) {
      markMessagesAsRead();
    }
    scrollToBottom();
  };

  if (userId && provider._id) {
    fetchMessages();
    socket.on("chat message", handleIncomingMessage);
    socket.on("typing", ({ userId: typingUserId }) => {
      if (typingUserId === provider._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
  }
    return () => {
      socket.off("chat message", handleIncomingMessage);
    };
  }, [userId, provider._id, token, apiUrl]);

  const markMessagesAsRead = async () => {
    console.log('Marking messages as read for provider:', provider?._id);
    console.log('Current userId:', userId);
    if (!provider?._id || !userId) return;
    try {
      await axios.put(
        `${apiUrl}/api/messages/${provider._id}/read`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
        }
      );
      console.log('Mark as read response:', response.data);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msg = {
        providerId: provider._id,
        content: newMessage.trim(),
      };
      try {
        const { data } = await axios.post(`${apiUrl}/api/sendMessage`, msg, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
        });    
        if (data?.data) {
          setMessages((prevMessages) => [...prevMessages, data.data]); 
          scrollToBottom();
        }else{
          setError("Failed to send message");
          console.error("Error: data.message is undefined!", data);
        }
        setNewMessage("");
    }
    catch (error) {
      console.error("Error sending message:", error);
    }
  }
  };

  const handleTyping = () => {
    socket.emit("typing", { userId, receiverId: provider._id });
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
      <div className="bg-white w-96 p-4 rounded-lg shadow-lg relative">
        <button className="absolute top-2 right-2 text-grey" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <h2 className="text-lg font-bold mb-4">Chat with {provider.username}</h2>
        <div className="h-64 overflow-y-auto border p-2 mb-2">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`p-2 my-1 rounded-lg max-w-[75%] ${
                msg.sender === userId ? "ml-auto bg-p text-white" : "bg-dark-grey"
              }`}
            >
               <div className="break-words">{msg.content}</div>
              <div className={`text-xs mt-1 ${
                msg.sender === userId ? "text-blue-100" : "text-gray-500"
              }`}>
             {new Date(msg.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
            </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-gray-500 text-sm italic">
              {provider.username} is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          onInput={handleTyping}
          />
          <button type="submit" className="bg-p text-white px-4 py-2 rounded" disabled={!newMessage.trim()}>
            Send
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;