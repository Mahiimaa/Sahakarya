import React, {useState, useEffect} from 'react'
import logo from "../assets/logo.png"
import profile from "../assets/profile.png"
import {NavLink, useNavigate} from "react-router-dom"
import email from "../assets/email.png"
import phone from "../assets/phone.png"
import logout from "../assets/logout.png"
import notification from "../assets/notification.png"
import axios from "axios"
import io from "socket.io-client";
import { IoGitPullRequestOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { TfiAnnouncement } from "react-icons/tfi";

const socket = io(process.env.REACT_APP_API_BASE_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to WebSocket server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("WebSocket connection error:", err);
});


function Navbar() {
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const setActiveClass = ({ isActive }) =>
    {
      return `flex items-center gap-6 pr-6 transition-all duration-200 ease-in-out ${isActive ? "bg-white text-p rounded-lg " : "hover:text-p hover:rounded-lg"}`;
    }

    const openChangePassword = () => {
      navigate("/changePassword");
    };

    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
      const fetchUserDetails = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log('Token:', token);
          if (!token) {
            navigate('/login'); 
            return;
          }
          const response = await axios.get(`${apiUrl}/api/user/me`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          setUserDetails(response.data);

          console.log("Joining room with userId:", response.data.id);
          socket.emit("joinRoom", { userId: response.data.id });
          try{
          const notifResponse = await axios.get(`${apiUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (Array.isArray(notifResponse.data)) {
            setNotifications(notifResponse.data);
            setUnreadCount(notifResponse.data.filter((notif) => !notif.isRead).length);
          } else if (notifResponse.data && Array.isArray(notifResponse.data.notifications)) {
            setNotifications(notifResponse.data.notifications);
            setUnreadCount(notifResponse.data.unreadCount || 0);
          } else {
            console.warn("Unexpected notifications format:", notifResponse.data);
            setNotifications([]);
            setUnreadCount(0);
          }
        } catch (notifError) {
          console.error("Error fetching notifications:", notifError);
          setNotifications([]);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setNotifications([]);
        setError("Failed to load user details.");
      }
    };
    fetchUserDetails();
      socket.on("newNotification", (notification) => {
        console.log("Received new notification:", notification);
        if (notification) {
          setNotifications(prev => {
            return Array.isArray(prev) ? [notification, ...prev] : [notification];
          });
          setUnreadCount(prev => prev + 1);
        }
      });
  
      return () => {
        socket.off("newNotification");
      };
    }, [apiUrl, navigate]);

    const handleNotificationClick = async (notification) => {
      try {
        if (!notification || !notification._id) {
          console.error("Invalid notification:", notification);
          return;
        }
        await axios.put(`${apiUrl}/api/notifications/mark-read/${notification._id}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNotifications(prev => {
          if (!Array.isArray(prev)) return [];
          return prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          );
        });
        
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        if (notification.type === 'request') {
          navigate(`/request`);
        } else if (notification.type === 'chat') {
          navigate(`/chat`);
        }
        setShowDropdown(false);
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    };

    const markAllAsRead = async () => {
      try {
        await axios.put(`${apiUrl}/api/read-all`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNotifications(prev => {
          if (!Array.isArray(prev)) return [];
          return prev.map(n => ({ ...n, isRead: true }));
        });
        setUnreadCount(0);
      } catch (error) {
        console.error("Error marking all as read:", error);
      }
    };

    const handleLogout = async () => {
      try {
        await axios.post(`${apiUrl}/api/logout`);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate('/', { state: { message: 'You have successfully logged out!' } });
      } catch (error) {
        alert(error.response?.data?.message || 'Something went wrong!');
      }
    };
    
    const UserProfile = () => {
      navigate("/userProfile");
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'request':
          return <IoGitPullRequestOutline />; 
        case 'chat':
          return <IoChatbubbleEllipsesOutline/>;
        default:
          return <TfiAnnouncement/>;
      }
    };
 
  return (
        <div className=" flex justify-between p-2 px-28 bg-white">
        <div className="flex gap-28 items-center">
        <img className="w-24 h-24 py-4"  src={logo} alt="logo"></img>
        <NavLink to ="/home" className ={setActiveClass}>
          <p className=" font-semi-bold text-h3 p-2" >Home</p>
          </NavLink>
          <NavLink to ="/explore" className ={setActiveClass}>
          <p className="font-semi-bold text-h3 p-2">Explore</p>
          </NavLink>
          <NavLink to ="/request" className ={setActiveClass}>
          <p className=" font-semi-bold text-h3 p-2">Request</p>
          </NavLink>
          <NavLink to ="/chat" className ={setActiveClass}>
          <p className=" font-semi-bold text-h3 p-2">Chat</p>
          </NavLink>
          <NavLink to ="/transactions" className ={setActiveClass}>
          <p className="font-semi-bold text-h3 p-2">Transactions</p>
          </NavLink>
          </div>
          <div className="flex gap-8 justify-center items-center">
            <div className="relative">
            <button 
            className="relative focus:outline-none" 
            onClick={() => setShowDropdown(prev => !prev)}
          >
            <img className="w-10 h-16 py-4 mt-2" src={notification} alt="notification"/>
            {unreadCount > 0 && (
              <span className="absolute top-4 left-4 bg-p/90 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-4 bg-white w-80 border border-dark-grey rounded-lg shadow-lg z-50 top-3/4">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-p/60 border border-p rounded-full w-6 h-6 text-sm text-center">
                    {unreadCount}
                  </span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-p hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!Array.isArray(notifications) ? (
                  <p className="text-grey text-center p-4">Error loading notifications</p>
                ) : notifications.length === 0 ? (
                  <p className="text-grey text-center p-4">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 border-b cursor-pointer hover:bg-dark-grey transition-colors ${!notif.isRead ? 'bg-p/20' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-lg mt-1">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-dark-grey mt-1">
                            {formatDate(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="h-2 w-2 bg-p rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
          
          <details className="relative">
          <summary className="list-none cursor-pointer ">
          <img className="w-10 h-16 py-4" src={profile} alt="profile"></img>
          </summary>
          <ul className="absolute right-[50%] bg-white w-[16vw] border border-dark-grey rounded p-4 top-10 ">
          {error ? (
              <div className="text-error">{error}</div>
            ) : userDetails ? (
              <div>
            <div className="flex gap-3 items-center ">
              <div className="flex flex-col px-4">
                <h1 className="font-poppins font-semi-bold text-s text-h3 ">{userDetails.username || 'N/A'}</h1>
              </div>
            </div>
            <hr className="border-[1px] border-grey m-2"></hr>
            <div className="flex flex-col px-4 ">
              <div className="flex items-center gap-2">
                <img className="w-6 h-6" src={email} alt="" />
                <li className="py-2 ">{userDetails.email || 'N/A'}</li>
              </div>
              <div className="flex items-center gap-2">
                <img className="w-6 h-6" src={phone} alt="" />
                <li className="py-2 ">{userDetails.phone || 'N/A'} </li>
              </div>
              <div className="flex items-center gap-2">
                <img className="w-6 h-6" src={profile}  alt="" /> 
                <li className="py-2" onClick={UserProfile} >User Profile</li>
              </div>
              <div className="flex items-center gap-2">
                <img className="w-6 h-6" src={logout} onClick={handleLogout} alt="" /> 
                <li className="py-2">Logout</li>
              </div>
              <div className="flex justify-center">
                <button
                  className="w-[100%] bg-p hover:bg-p/60 rounded p-2 mt-2 text-white "
                  onClick={openChangePassword}
                >
                  Change Password
                </button>
              </div>
            </div>
            </div>
            ) : (
              <div className="text-grey">Loading...</div>
            )}
          </ul>
        </details>
          </div>
    </div>
  )
}

export default Navbar