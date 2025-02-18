import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

const Chat = ({ isOpen, onClose, recipient }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, sender: "me" }]);
      setNewMessage("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-96 p-4 rounded-lg shadow-lg relative">
        <button className="absolute top-2 right-2 text-gray-600" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <h2 className="text-lg font-bold mb-4">Chat with {recipient}</h2>
        <div className="h-64 overflow-y-auto border p-2 mb-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 my-1 rounded-lg max-w-[75%] ${
                msg.sender === "me" ? "ml-auto bg-blue-500 text-white" : "bg-gray-200"
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
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;