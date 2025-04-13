import React, { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import notificationIcon from "../assets/notification.png";
import { IoGitPullRequestOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { TfiAnnouncement } from "react-icons/tfi";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_BASE_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

function AdminTop() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.id) {
      socket.emit("joinRoom", { userId: user.id });
    }

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifData = Array.isArray(res.data)
          ? res.data
          : res.data.notifications || [];

        setNotifications(notifData);
        setUnreadCount(notifData.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Failed to load admin notifications", err);
      }
    };

    fetchNotifications();

    socket.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.off("newNotification");
  }, [apiUrl]);

  const handleNotificationClick = async (notif) => {
    try {
      await axios.put(`${apiUrl}/api/notifications/mark-read/${notif._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (notif.type === "serviceRequest") {
        navigate("/adminrequest");
      } 
      else if(notif.type === "cashout") {
        navigate("/adminTransactions");
      }
      else if(notif.type === "mediation") {
        navigate("/adminMediation");
      }   else {
        navigate("/adminhome");
      }
      

      setShowDropdown(false);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "request":
        return <IoGitPullRequestOutline className="text-p" />;
      case "chat":
        return <IoChatbubbleEllipsesOutline className="text-p" />;
      default:
        return <TfiAnnouncement className="text-p" />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${apiUrl}/api/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
    await axios.post(`${apiUrl}/api/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn("Logout error:", error.response?.data?.message || error.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { state: { message: "You have successfully logged out!" } });
  }
  };
  
  return (
    <div className="bg-white w-[88vw] h-20 flex justify-between items-center font-poppins">
        <p className="text-h1 text-s"> Welcome, Admin!</p>
        <div className="flex gap-4 items-center">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowDropdown(!showDropdown)}>
            <img className="w-8 h-8" src={notificationIcon} alt="Notifications" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-p text-white rounded-full px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow z-50">
              <div className="p-3 font-semibold flex justify-between">Notifications
              {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-p hover:underline">
                    Mark all as read
                  </button>
                )}
                </div>
              <div className="max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-2 text-sm cursor-pointer hover:bg-light-grey ${
                      !notif.isRead ? "bg-p/10" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notif.type)}
                      <div>
                        <p>{notif.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                 ))
                )}
              </div>
            </div>
          )}
        </div>
        <button className="text-p bg-white p-2 px-6 mr-4 border-p border-2 rounded-md" onClick={handleLogout}> Logout</button>
    </div>
    </div>
  )
}

export default AdminTop