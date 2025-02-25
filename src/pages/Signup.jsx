import React, { useState } from 'react';
import logo from "../assets/logo.png";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user',  
  });

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setError(""); 
  };

  const handleToggleRole = () => {
    setUser((prevUser) => ({
      ...prevUser,
      role: prevUser.role === 'user' ? 'admin' : 'user',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    console.log(user);
    try {
      const response = await axios.post(`${apiUrl}/api/signup`, user);
      setMessage(response.data.message);
      
      navigate("/", {
        state: {
          message: "Sign up successful! Please log in."
        }
      });
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
      setError(error.response?.data?.message || "Error during signup");
    }
  };

  return (
    <div className='flex flex-col justify-center items-center mt-20'>
      {message && <div className="text-p font-poppins mb-4">{message}</div>}
      <div className="flex justify-between items-center gap-96 ">
        <img className="hidden desk:block w-80 h-80 py-4" src={logo} alt="logo" />
        <div className="flex flex-col justify-center items-center ">
          <img className="w-32 h-26 py-4" src={logo} alt="logo" />
          <div className="flex flex-col justify-center items-center">
            <p className='text-p font-bold font-poppins text-main mb-2'>Sign Up</p>
            <div className="flex items-center">
              <button
                className={`px-4 py-2 rounded-full ${
                  user.role === 'user' ? 'bg-p text-white' : 'bg-gray-300 text-gray-700'
                }`}
                onClick={handleToggleRole}
              >
                User
              </button>
              <button
                className={`ml-2 px-4 py-2 rounded-full ${
                  user.role === 'admin' ? 'bg-p text-white' : 'bg-gray-300 text-gray-700'
                }`}
                onClick={handleToggleRole}
              >
                Admin
              </button>
            </div>
            <form className='flex flex-col justify-center items-center mt-8 gap-8' onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Email address:</label>
                <input 
                  className="px-2 w-72 h-12 py-2 border border-iborder rounded-md" 
                  placeholder='Enter your email address' 
                  type="email" 
                  name="email" 
                  required
                  value={user.email}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Username:</label>
                <input 
                  className="px-2 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Enter your username" 
                  type="text" 
                  name="username" 
                  required
                  value={user.username}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Password:</label>
                <input 
                  className="px-2 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Enter your password" 
                  type="password" 
                  name="password" 
                  required
                  value={user.password}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Confirm Password:</label>
                <input 
                  className="px-2 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Re-enter your password" 
                  type="password" 
                  name="confirmPassword" 
                  required
                  value={user.confirmPassword}
                  onChange={handleChange} 
                />
              </div>

              {error && <p className="text-error">{error}</p>}

              <div className="flex flex-col justify-center items-center mt-6">
                <button className="bg-p hover:bg-p-dark text-h2 p-2 px-24 rounded-md text-white">Sign Up</button>
                <div className="flex gap-2">
                  <p>Already have an account?</p>
                  <Link to="/" className='text-p'>Log in</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
