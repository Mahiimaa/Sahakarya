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
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setError(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    console.log(user);
    try {
      const response = await axios.post(`${apiUrl}/api/signup`, {...user, 
        adminKey: showAdminKey ? adminKey : '',
      });
      setMessage(response.data.message);
      navigate("/verify-otp", {
        state: {
          email: user.email,
          message: "Sign up successful! Please log in."
        }
      });
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
      setError(error.response?.data?.message || "Error during signup");
    }
  };

  return (
    <div className='flex flex-col justify-center items-center md:mt-10 font-poppins'>
        <div className="flex flex-col justify-center items-center md:bg-white md:p-6 md:px-12 md:shadow-md md:border md:rounded-md  ">
          <img className="w-32 h-26 py-4" src={logo} alt="logo" />
            <p className='text-p font-bold font-poppins text-main '>Sign Up</p>
            <form className='flex flex-col justify-center items-center mt-8 gap-8' onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Email address:</label>
                <input 
                  className="px-2 md:w-96 w-72 h-12 py-2 border border-iborder rounded-md" 
                  placeholder='Enter your email address' 
                  type="email" 
                  name="email" 
                  required
                  value={user.email}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col">
                <label className="flex font-poppins text-h3">Username:</label>
                <input 
                  className="px-2 md:w-96 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Enter your username" 
                  type="text" 
                  name="username" 
                  required
                  value={user.username}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex self-start gap-2 ml-4 md:ml-0">
              <input
                type="checkbox"
                id="adminCheck"
                checked={showAdminKey}
                onChange={(e) => setShowAdminKey(e.target.checked)}
              />
              <label htmlFor="adminCheck" className="text-sm text-gray-700">Are you an admin?</label>
            </div>
            {showAdminKey && (
              <div className="flex flex-col ">
              <label className="flex font-poppins text-h3">Admin Key:</label>
              <input
                className="px-2 md:w-96 w-72 py-2 h-12 border border-iborder rounded-md"
                type="text"
                name="adminKey"
                placeholder="Enter Admin Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              </div>
            )}
              <div className="flex flex-col">
                <label className="flex font-poppins text-h3">Password:</label>
                <input 
                  className="px-2 md:w-96 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Enter your password" 
                  type="password" 
                  name="password" 
                  required
                  value={user.password}
                  onChange={handleChange} 
                />
              </div>
              <div className="flex flex-col ">
                <label className="flex font-poppins text-h3">Confirm Password:</label>
                <input 
                  className="px-2 md:w-96 w-72 py-2 h-12 border border-iborder rounded-md" 
                  placeholder="Re-enter your password" 
                  type="password" 
                  name="confirmPassword" 
                  required
                  value={user.confirmPassword}
                  onChange={handleChange} 
                />
              </div>

              {error && <p className="text-error">{error}</p>}

              <div className="flex flex-col justify-center items-center mt-2">
                <button className="bg-p hover:bg-p/90 text-h2 p-2 px-28 md:w-96 rounded-md text-white">Sign Up</button>
                <div className="flex gap-2">
                  <p>Already have an account?</p>
                  <Link to="/" className='text-p'>Log in</Link>
                </div>
              </div>
            </form>
        </div>
      </div>
  );
}

export default Signup;
