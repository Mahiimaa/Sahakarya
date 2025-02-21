import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Link } from "react-router-dom";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(data.chatUsers);
      } catch (error) {
        console.error("Error fetching chat list:", error);
      }
    };

    fetchChats();
  }, []);

  return (
    <div className ="flex flex-col">
       <Navbar/>
    <div className="flex flex-col items-center p-6">
      <h1 className="text-h2 font-bold mb-4 ">My Chats</h1>
      <div className="space-y-3">
        {chats.length > 0 ? (
          chats.map((chatUser) => (
            <Link
              key={chatUser}
              to={`/chat/${chatUser}`}
              className="block p-3 border rounded bg-white shadow hover:bg-dark-grey"
            >
              Chat with User ID: {chatUser}
            </Link>
          ))
        ) : (
          <p className="text-s">No chats available</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default ChatList;
