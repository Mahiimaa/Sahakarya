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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const navClass = ({ isActive }) => `px-4 py-2 text-semi-bold font-medium ${isActive ? 'text-p' : ''} hover:text-p`;

    const openChangePassword = () => {
      navigate("/changePassword");
      setIsMobileMenuOpen(false);
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
          console.log("User response:", response.data);
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
            console.log("notifications:", notifResponse.data.notifications);
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
        else {
          navigate(`/request`);
        }
        setShowDropdown(false);
        setIsMobileMenuOpen(false);
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
      if (userDetails?.id) {
        navigate(`/user-profile/${userDetails.id}`);
      } else {
        console.error("User ID not found");
      }
      setIsMobileMenuOpen(false);
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
          return <IoGitPullRequestOutline className="text-p"/>; 
        case 'chat':
          return <IoChatbubbleEllipsesOutline className="text-p"/>;
        default:
          return <TfiAnnouncement className="text-p"/>;
      }
    };
 
  return (
    <nav className="bg-white border-b border-light-grey shadow-sm font-poppins">
    <div className="flex justify-between items-center px-4 py-2 md:px-12">
      <div className="flex items-center gap-4">
        <img className="h-12 w-12 md:h-16 md:w-20" src={logo} alt="logo" />
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="hidden md:flex gap-6 items-center">
        <NavLink to="/home" className={navClass}>Home</NavLink>
        <NavLink to="/explore" className={navClass}>Explore</NavLink>
        <NavLink to="/request" className={navClass}>Request</NavLink>
        <NavLink to="/chat" className={navClass}>Chat</NavLink>
        <NavLink to="/transactions" className={navClass}>Transactions</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-sm text-p font-semibold">
          Credits: <span className={userDetails?.timeCredits < 3 ? 'text-error ml-1' : 'ml-1'}>{userDetails?.timeCredits || 0}</span>
        </div>

        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)}>
            <img className="w-8 h-8 " src={notification} alt="notif" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 text-xs bg-p text-white rounded-full px-1">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-dark-grey rounded-md shadow-md z-50 max-w-80">
              <div className="p-3 border-b flex justify-between">
                <span className="font-semi-bold">Notifications</span>
                {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-p hover:underline">Mark all</button>}
              </div>
              <div className="max-h-64 overflow-y-auto max-w-80">
                {notifications.map((notif) => (
                  <div key={notif._id} onClick={() => handleNotificationClick(notif)} className={`p-2 cursor-pointer text-sm hover:bg-light-grey ${!notif.isRead ? 'bg-p/10' : ''}`}>
                    <div className="flex items-start text-body gap-2">
                     <p className="flex items-start text-body mt-2">{getNotificationIcon(notif.type)}</p> 
                      <div>
                        <p className='text-body'>{notif.message}</p>
                        <p className="text-xs text-grey">{formatDate(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <details className="relative">
          <summary className="cursor-pointer list-none">
            <img className="w-8 h-8 rounded-full" src={profile} alt="profile" />
          </summary>
          <ul className="absolute right-0 mt-2 w-64 bg-white border border-dark-grey rounded-md shadow-md z-50 p-4 md:w-80 ">
            {userDetails ? (
              <>
                <li className="font-bold text-sm mb-2 md:text-h3">{userDetails.username}</li>
                <hr className="border border-p mb-2"/>
                <li className="text-sm md:text-h3 flex items-center gap-2 py-2"><img src={email} className="w-4 h-4 md:w-6 md:h-6" /> {userDetails.email}</li>
                <li className="text-sm md:text-h3 flex items-center gap-2 py-2"><img src={phone} className="w-4 h-4 md:w-6 md:h-6" /> {userDetails.phone}</li>
                <li className="text-sm md:text-h3 flex items-center gap-2 cursor-pointer py-2 hover:text-p" onClick={UserProfile}><img src={profile} className="w-4 h-4 md:w-6 md:h-6" /> Profile</li>
                <li className="text-sm md:text-h3 flex items-center gap-2 cursor-pointer py-2 hover:text-p" onClick={handleLogout}><img src={logout} className="w-4 h-4 md:w-6 md:h-6" /> Logout</li>
                <button className="w-full bg-p hover:bg-p/85 rounded p-2 mt-2 text-white md:text-h3 py-2" onClick={openChangePassword}>
                    Change Password
                  </button>
              </>
            ) : <li className="text-grey">Loading...</li>}
          </ul>
        </details>
      </div>
    </div>

    {/* Mobile Menu */}
    {isMobileMenuOpen && (
      <div className="md:hidden flex flex-col gap-2 px-4 pb-4">
        <NavLink to="/home" className={navClass} onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
        <NavLink to="/explore" className={navClass} onClick={() => setIsMobileMenuOpen(false)}>Explore</NavLink>
        <NavLink to="/request" className={navClass} onClick={() => setIsMobileMenuOpen(false)}>Request</NavLink>
        <NavLink to="/chat" className={navClass} onClick={() => setIsMobileMenuOpen(false)}>Chat</NavLink>
        <NavLink to="/transactions" className={navClass} onClick={() => setIsMobileMenuOpen(false)}>Transactions</NavLink>
      </div>
    )}
  </nav>
  )
}

export default Navbar