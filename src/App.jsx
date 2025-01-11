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
import "./index.css";

 function App() {
return (
  <div className="App">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path ="/email" element={<Email />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgot" element={<Forgot />} />
        {/* <Route path="/reset" element={<Reset />} /> */}
        <Route path ="/adminhome" element={<AdminHome/>} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/navbar" element={<Navbar />} />
        </Routes>
        </BrowserRouter>
        </div>
  )
}

export default App