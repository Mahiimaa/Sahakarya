import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import { IoClose } from "react-icons/io5";
const socket = io('http://localhost:5000');
const Chat = ({ isOpen, onClose, recipient }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect (() => {
    const messageHandler= (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };
    socket.on("chat message", messageHandler);

    return () => {
      socket.off('chat message', messageHandler); 
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msg = {
        sender: "me",
        text: newMessage,
      };
      socket.emit("chat message", msg);
      setMessages((prevMessages) => [...prevMessages, msg]); 
      setNewMessage(""); 
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-grey bg-opacity-50">
      <div className="bg-white w-96 p-4 rounded-lg shadow-lg relative">
        <button className="absolute top-2 right-2 text-grey" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <h2 className="text-lg font-bold mb-4">Chat with {recipient}</h2>
        <div className="h-64 overflow-y-auto border p-2 mb-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 my-1 rounded-lg max-w-[75%] ${
                msg.sender === "me" ? "ml-auto bg-p text-white" : "bg-dark-grey"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
          />
          <button className="bg-p text-white px-4 py-2 rounded" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;