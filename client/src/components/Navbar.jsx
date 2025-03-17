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

          const notifResponse = await axios.get(`${apiUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log("Joining room with userId:", response.data.id);
          setNotifications(notifResponse.data);
          setUnreadCount(notifResponse.data.filter((notif) => !notif.isRead).length);
        } catch (err) {
          setError("Failed to load user details.");
        }
      };
      fetchUserDetails();

      socket.on("connect", () => {
        console.log("Connected to WebSocket server:", socket.id);
      });
    
      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err);
      });

      socket.on("newNotification", (notification) => {
        console.log("Received new notification:", notification);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
  
      return () => {
        socket.off("newNotification");
      };
    }, [apiUrl, navigate]);

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
            <details className="relative">
            <summary  className="list-none cursor-pointer">
              <img className="w-10 h-16 py-4" src={notification} alt="notification"/>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              </summary>
              <ul className="absolute right-[50%] bg-white w-[16vw] border border-dark-grey rounded p-4 top-10 ">
                <div className="flex justify-between">
                <p>Notifications</p>
                <p className='bg-p/60 border border-p rounded-full w-6 h-6 text-center'>{unreadCount}</p>
                </div>
                <hr className='my-2'/>
                {notifications.length === 0 ? (
              <p className="text-gray-500 text-center">No notifications</p>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={index} className="p-2 border-b">
                      <p className="text-body">{notif.message}</p>
                      <p className="text-small text-grey">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </ul>
              </details>
          
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
                  className="w-[100%] bg-p rounded p-2 mt-2 text-white "
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