import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import Chat from "../components/Chat";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(data.chats);
        setCurrentUser(data.currentUser);
      } catch (error) {
        console.error("Error fetching chat list:", error);
      }
    };

    fetchChats();
  }, []);

  const openChat = (chat) => {
    if (!currentUser) {
      console.error("Current user not set");
      return;
    }
    setSelectedChat({
      provider: chat.user,
      requester: currentUser
    });
  };

  return (
    <div className ="flex flex-col">
       <Navbar/>
    <div className="flex flex-col items-center p-6">
      {/* <h1 className="text-h2 font-bold mb-4 ">My Chats</h1> */}
      <div className="w-1/2">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <button
                key={chat.user._id}
                onClick={() => openChat(chat)} 
                className="flex items-center gap-4 p-4 border border-dark-grey rounded-lg bg-white shadow hover:bg-light-grey transition w-full"
              >
                <img
                  src={chat.user.profilePicture} 
                  alt={chat.user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex flex-col items-start">
                  <p className="font-semi-bold text-h2">{chat.user.username}</p>
                  <p className="text-h3 text-grey">
                    {chat.lastMessage.content.length > 30
                      ? chat.lastMessage.content.substring(0, 30) + "..."
                      : chat.lastMessage.content}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            ))
          ) : (
            <p className="text-s">No chats available</p>
          )}
        </div>
      </div>
      {selectedChat && (
        <Chat provider={selectedChat.provider} requester={selectedChat.requester} onClose={() => setSelectedChat(null)} />
      )}
    </div>
  );
};

export default ChatList;
