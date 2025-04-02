import React, { useEffect, useState, useRef} from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import Chat from "../components/Chat";
import { Search, MessageCircle, Clock, X, Loader2 } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`${apiUrl}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(data.chats);
        setCurrentUser(data.currentUser);
      } catch (error) {
        console.error("Error fetching chat list:", error);
        setError("Failed to load chats. Please try again later.")
      }finally {
        setIsLoading(false)
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = chats.filter(
      (chat) =>
        chat.user.username.toLowerCase().includes(query) ||
        (chat.lastMessage?.content && chat.lastMessage.content.toLowerCase().includes(query)),
    )
    setFilteredChats(filtered)
  }, [searchQuery, chats])

  const openChat = async (chat) => {
    if (!currentUser) return;
      try {
        await axios.put(
          `${apiUrl}/api/messages/${chat.user._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.user._id === chat.user._id ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.error("Failed to mark messages as read", err);
      }
    setSelectedChat({
      provider: chat.user,
      requester: currentUser
    });
  };

  const clearSearch = () => {
    setSearchQuery("")
    searchInputRef.current?.focus()
  }

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)

    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-poppins">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b bg-p/80 text-white">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center">
              <MessageCircle className="mr-2 h-6 w-6" />
              My Conversations
            </h1>
          </div>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-p/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Chat List */}
          <div className="divide-y">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-p animate-spin mb-2" />
                <p className="text-gray-500">Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <p>{error}</p>
                <button className="mt-2 text-p hover:underline" onClick={() => window.location.reload()}>
                  Try again
                </button>
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <button
                  key={chat.user._id}
                  onClick={() => openChat(chat)}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50 transition w-full text-left relative"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={chat.user.profilePicture || "/placeholder.svg?height=48&width=48"}
                      alt={chat.user.username}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                    {chat.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-lg truncate">{chat.user.username}</h3>
                      <span className="text-xs text-gray-500 flex items-center whitespace-nowrap ml-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatMessageTime(chat.lastMessage?.createdAt)}
                      </span>
                    </div>

                    <p className="text-gray-600 truncate text-sm sm:text-base">
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="bg-p text-white text-xs font-medium px-2.5 py-1 rounded-full min-w-[1.5rem] flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              ))
            ) : searchQuery ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations match your search</p>
                <button className="mt-2 text-p hover:underline" onClick={clearSearch}>
                  Clear search
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations available</p>
                <p className="text-sm mt-1">Start a conversation from your service requests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedChat && (
        <Chat
          provider={selectedChat.provider}
          requester={selectedChat.requester}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
};

export default ChatList;
