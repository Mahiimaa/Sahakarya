import React from 'react'
import { BrowserRouter, Routes, Route } from'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Forgot from './pages/Forgot';
import Home from './pages/Home';
// import Reset from './pages/Reset';
import AdminHome from './pages/AdminHome';
import ChangePassword from './pages/changePassword';
import Reset from './pages/Reset';
import Verify from './pages/Verify';
import Email from './pages/Email';
import Navbar from './components//Navbar';
import AdminService from "./pages/AdminService";
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import AdminTransaction from "./pages/AdminTransaction";
import Category from "./pages/Category";
import AdminSettings from "./pages/AdminSettings";
import Explore from "./pages/Explore";
import ServiceDetails from "./pages/ServiceDetails";
import ProviderDetails from "./pages/ProviderDetails";
import Request from "./pages/Request";
import Booking from "./pages/Booking";
import ChatHistory from "./pages/ChatHistory";
import UserProfile from "./pages/UserProfile";
import EditProfile from './pages/EditProfile';
import UserServices from "./pages/Userservices";
import TimeCredit from "./pages/TimeCredit";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

 function App() {
return (
  <div className="App">
        <ToastContainer />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path ="/email" element={<Email />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/home" element={<Home />} />
        <Route path ="/explore" element={<Explore />} />
        <Route path="/services/:_id" element={<ServiceDetails />} />
        <Route path="/provider-details/:providerId" element={<ProviderDetails />} />
        <Route path ="/chat" element={<ChatHistory />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path ="/adminhome" element={<AdminHome/>} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/navbar" element={<Navbar />} />
        <Route path="/userProfile" element={<UserProfile />} />
        <Route path ="/editProfile" element={<EditProfile />} />
        <Route path="/my-services" element={<UserServices />} />
        <Route path="/timeCredit" element={<TimeCredit/>} />
        <Route path="/services" element={<AdminService />} />
        <Route path="/booking/:serviceId/:providerId" element={<Booking />} />
        <Route path="/request" element={<Request />} />
        <Route path="/users" element={<Users />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/adminTransactions" element={<AdminTransaction/>} />
        <Route path="/category" element={<Category />} />
        <Route path="/adminsettings" element={<AdminSettings />} />
        </Routes>
        </BrowserRouter>
        </div>
  )
}

export default App