import React, { useState, useEffect, useRef } from "react";
import {io} from 'socket.io-client';
import axios from "axios";
import { X, Send, Loader2, Camera } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"

const getRoomId = (providerId, requesterId) => {
  return [providerId, requesterId].sort().join('_');
};

const socket = io("ws://localhost:5000", { transports: ["websocket", "polling"] , autoConnect: false,  withCredentials: true,});
const Chat = ({ onClose, provider, requester}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const chatContainerRef = useRef(null)
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const listenerRegistered = useRef(false);

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
      setIsLoading(true)
      try {
        const { data } = await axios.get(`${apiUrl}/api/messages/${provider._id}/${requester._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMessages(data.messages);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
      finally {
        setIsLoading(false)
      }
    };
    fetchMessages();
  }, [userId, provider?._id, requester?._id, token, apiUrl]);
  

  useEffect(() => {
    if (!userId || !provider?._id || !requester?._id) return;
    const roomId = getRoomId(provider._id, requester._id);
    if (!socket.connected) {
      socket.connect();
      socket.on('connect', () => {
        console.log(`Socket connected: ${socket.id}`);
        socket.emit("joinRoom", { roomId, userId });
        console.log(`Emitted joinRoom for user ${userId} to room ${roomId}`);
      });
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to chat server');
      });
    } else {
      socket.emit("joinRoom", { roomId, userId });
      console.log(`Emitted joinRoom for user ${userId} to room ${roomId}`);
    }

    const handleIncomingMessage = (msg) => {
      console.log(`Received message in room ${roomId}, ID: ${msg._id}, Content: ${msg.content}, Sender: ${msg.sender}`);
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (m) =>
            (m._id === msg._id && m._id !== undefined && msg._id !== undefined) ||
            (m.sender === msg.sender &&
             m.content === msg.content &&
             m.createdAt === msg.createdAt &&
             m.isTemp !== true)
        );
        if (messageExists) {
          console.log(`Duplicate message detected, ID: ${msg._id}, Content: ${msg.content}`);
          return prevMessages;
        }
        const tempMessage = prevMessages.find(
          (m) => m.isTemp && m.sender === msg.sender && m.content === msg.content && m.createdAt === msg.createdAt
        );
        if (tempMessage) {
          console.log(`Removing temp message, Temp ID: ${tempMessage._id}, Replacing with server ID: ${msg._id}`);
          return [
            ...prevMessages.filter((m) => m._id !== tempMessage._id),
            { ...msg, isTemp: false }
          ];
        }
        return [...prevMessages, { ...msg, isTemp: false }];
      });
      scrollToBottom();
    };

    if (!listenerRegistered.current) {
      console.log(`Registering chatMessage listener for room ${roomId}`);
      socket.on("chatMessage", handleIncomingMessage);
      listenerRegistered.current = true;
    } else {
      console.log(`chatMessage listener already registered for room ${roomId}`);
    }

    return () => {
      console.log(`Cleaning up chatMessage listener for room ${roomId}`);
      socket.off("chatMessage", handleIncomingMessage);
      socket.off('connect');
      socket.off('connect_error');
      listenerRegistered.current = false;
      if (socket.connected) {
        socket.emit("leaveRoom", { roomId, userId });
      }
    };
  }, [userId, provider?._id, requester?._id])
  
useEffect(() => {
  scrollToBottom();
}, [messages]);

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim()) return;
  const receiverId = String(userId) === String(provider._id) ? requester._id : provider._id;
  const roomId = getRoomId(provider._id, requester._id);
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      sender: userId,
      receiver: receiverId,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    console.log(`Adding optimistic message, temp ID: ${tempId}`);
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setIsSending(true);
    const msg = {
      roomId,
      providerId: provider._id,
      requesterId: requester._id,
      receiver: receiverId,
      content: newMessage.trim(),
      sender: userId,
    };

    try {
      socket.emit("chatMessage", msg, (response) => {
        if (response && response.error) {
          console.error("Error sending message:", response.error);
          setError("Failed to send message");
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
        } else {
          console.log(`Server confirmed message, ID: ${response._id}, Content: ${response.content}`);
          setMessages((prev) => {
            const updatedMessages = prev.filter((m) => m._id !== tempId);
            const messageExists = updatedMessages.some(
              (m) => m._id === response._id
            );
            if (messageExists) {
              console.log(`Message already added by chatMessage event, ID: ${response._id}`);
              return updatedMessages;
            }
            return [...updatedMessages, { ...response, isTemp: false }];
          });
        }
      });
    } catch (error) {
      console.error("Error emitting message:", error);
      setError("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

const formatMessageTime = (timestamp) => {
  if (!timestamp) return ""
  return format(new Date(timestamp), "h:mm a")
}
const getChatPartnerName = () => {
  if (!userId) return "Loading..."
  return String(userId) === String(provider._id) ? requester.username : provider.username
}

const formatChatDate = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy"); 
};

const fileInputRef = useRef(null);

const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const tempId = `temp-${Date.now()}`;
  const reader = new FileReader();

  reader.onload = async () => {
    const base64Image = reader.result;
    const tempMessage = {
      _id: tempId,
      sender: userId,
      receiver: String(userId) === String(provider._id) ? requester._id : provider._id,
      imageUrl: base64Image,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    const formData = new FormData();
    formData.append("image", file);
    formData.append("providerId", provider._id);
    formData.append("requesterId", requester._id);
    formData.append("sender", userId);
    formData.append("receiver", tempMessage.receiver);
    formData.append("roomId", getRoomId(provider._id, requester._id));
    try {
      const { data } = await axios.post(`${apiUrl}/api/messages/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessages(prev => prev.map(msg => msg._id === tempId ? data.message : msg));
      const messageWithRoom = {
        ...data.message,
        roomId: getRoomId(provider._id, requester._id),
      };
      socket.emit("chatMessage", messageWithRoom);
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload image");
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  reader.readAsDataURL(file); 
};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 font-poppins">
    <div className="bg-white w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg shadow-xl flex flex-col h-[80vh] max-h-[600px] overflow-hidden">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-p text-white">
        <h2 className="text-lg sm:text-xl font-semi-bold truncate">Chat with {getChatPartnerName()}</h2>
        <button
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X size={24} />
        </button>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 flex flex-col space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-p animate-spin" />
            <span className="ml-2 text-gray-500">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          (() => {
            let lastDate = null;
          return messages.map((msg, index) => {
            const messageDate = new Date(msg.createdAt);
            const currentDate = format(messageDate, "yyyy-MM-dd");
            const showDateSeparator = currentDate !== lastDate;
            lastDate = currentDate;
            
            const isSentByUser =
              userId &&
              msg.sender &&
              (String(msg.sender) === String(userId) ||
                (typeof msg.sender === "object" && msg.sender._id && String(msg.sender._id) === String(userId)))

            return (
              <React.Fragment key={msg._id || index}>
              {showDateSeparator && (
                <div className="text-center text-gray-500 text-xs my-4">
                  <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full shadow-sm">
                    {formatChatDate(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isSentByUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[85%] shadow-sm ${
                    isSentByUser
                      ? "bg-p text-white rounded-br-none"
                      : "bg-white border border-gray-200 rounded-bl-none"
                  }`}
                >
                  
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="shared"
                      className="max-w-xs sm:max-w-sm rounded-md"
                    />
                  ) : (
                  <div className="break-words text-sm sm:text-base">{msg.content}</div>)}
                  <div className={`text-xs mt-1 text-right ${isSentByUser ? "text-white/70" : "text-gray-500"}`}>
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
              </React.Fragment>
            );
          });
          }) ()
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <div className="p-2 bg-red-100 text-red-800 text-sm text-center">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t bg-white flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-p/50 focus:border-p"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(e)
            }
          }}
          disabled={isSending}
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
          <button
            type="button"
            className="text-p hover:bg-gray-100 p-2 rounded-full"
            onClick={() => fileInputRef.current.click()}
            aria-label="Upload Image"
          >
            <Camera className="h-5 w-5" />
          </button>
        <button
          type="submit"
          className="bg-p hover:bg-p/90 text-white p-2 sm:p-3 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center min-w-[60px]"
          disabled={!newMessage.trim() || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send size={18} className="mr-1 hidden sm:inline" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  </div>
  );
};

export default Chat;