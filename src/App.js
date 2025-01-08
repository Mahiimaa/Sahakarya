import React from 'react'
import { BrowserRouter, Routes, Route } from'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Forgot from './pages/Forgot';
import Home from './pages/Home';
import Reset from './pages/Reset';
import AdminHome from './pages/AdminHome';
import ChangePassword from './pages/changePassword';
import "./index.css";

 function App() {
return (
  <div className="App">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path ="/admin" element={<AdminHome/>} />
        <Route path="/changePassword" element={<ChangePassword />} />
        </Routes>
        </BrowserRouter>
        </div>
  )
}

export default App