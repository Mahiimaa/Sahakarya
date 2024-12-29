import React, {useEffect, useState} from 'react'
import axios from 'axios';
import logo from "../assets/logo.png";
import {Link, useNavigate} from "react-router-dom"

function Login() {
  const navigate = useNavigate();
  const [user, setUser] =  React.useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post( `${apiUrl}/api/login` , user);
      localStorage.setItem("token", response.data.token); 
      navigate("/home");
      
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
    
  };
  return (
    <div className='flex flex-col justify-center items-center mt-20'>
      <div className="flex justify-between items-center gap-96">
        <img  className=" hidden desk:block w-80 h-80 py-4" src={logo} alt="logo" />
        <div className="flex flex-col justify-center items-center">
       <img  className=" w-32 h-26 py-4" src={logo} alt="logo" />
       <div className="flex flex-col justify-center items-center">
        <p className='text-p font-bold font-poppins text-main'> Log in </p>
        <form className=' flex flex-col justify-center items-center mt-8 gap-8' onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
            <label className="flex font-poppins text-h3 ">Email address:</label>
            <input className=" px-2 w-72 h-12 py-2 border border-iborder rounded-md " placeholder='Enter your email address' type="email" name="email" 
            value={user.email}
            onChange={handleChange}
            required />
            </div>
            <div className="flex flex-col gap-2">
            <label className="flex font-poppins text-h3">Username:</label>
            <input className="px-2 w-72 py-2 h-12 border border-iborder rounded-md " placeholder="Enter your username" type="text" name="username" 
            value={user.username}
            onChange={handleChange}
            required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex font-poppins text-h3">Password:</label>
              <div className=" flex flex-col ">
              <input className="px-2 w-72 py-2 h-12 border border-iborder rounded-md" placeholder="Enter your password" type="password" name="password" 
              value={user.password}
              onChange={handleChange} 
              required/>
              <Link to ={"/forgot"} className="self-end text-p">Forgot password?</Link>
              </div>
            </div>
            {error && <p className="text-error">{error}</p>}
            <div className="flex flex-col justify-center items-center mt-6">
            <button className="bg-p text-h2 p-2 px-28 rounded-md text-white">Log in</button>
            <div className="flex gap-2">
            <p> Do not have an account? </p> 
           <Link to ={"/Signup"} className='text-p'> Sign up</Link>
            </div>
            </div>
        </form>
       </div>
       </div>
       </div>
       </div>
  )
}

export default Login