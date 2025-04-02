import React, { useState, useEffect, useRef } from "react";
import {io} from 'socket.io-client';
import axios from "axios";
import { X, Send, Loader2 } from "lucide-react"
import { format } from "date-fns"

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
      socket.on("chatMessage", handleIncomingMessage);
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
    setIsSending(true);
   
    socket.emit("chatMessage", msg);
      setNewMessage(""); 
    setIsSending(false)
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return ""
  return format(new Date(timestamp), "h:mm a")
}
const getChatPartnerName = () => {
  if (!userId) return "Loading..."
  return String(userId) === String(provider._id) ? requester.username : provider.username
}
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
          messages.map((msg, index) => {
            const isSentByUser =
              userId &&
              msg.sender &&
              (String(msg.sender) === String(userId) ||
                (typeof msg.sender === "object" && msg.sender._id && String(msg.sender._id) === String(userId)))

            return (
              <div
                key={msg._id || index}
                className={`flex ${isSentByUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[85%] shadow-sm ${
                    isSentByUser
                      ? "bg-p text-white rounded-br-none"
                      : "bg-white border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="break-words text-sm sm:text-base">{msg.content}</div>
                  <div className={`text-xs mt-1 text-right ${isSentByUser ? "text-white/70" : "text-gray-500"}`}>
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
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