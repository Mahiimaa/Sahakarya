import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from "../assets/logo.png";
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode';

function Login() {
  const location = useLocation();
  const message = location.state?.message || '';
  const navigate = useNavigate();
  const [user, setUser] = useState({
    identifier:'',
    password: '',
  });

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (token && role) {
        navigate(role === "admin" ? "/adminhome" : "/home");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!apiUrl) {
        setError("API configuration error. Please check your environment variables.");
        return;
      }

      const response = await axios.post(`${apiUrl}/api/login`, user);
      console.log('Login response:', response.data);
      if (!response.data) {
        setError("No response data received from server");
        return;
      }

      if (!response.data.token) {
        setError("Authentication token not received");
        return;
      }

      if (!response.data.role) {
        setError("User role not received");
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role); 
      navigate(response.data.role === "admin" ? "/adminhome" : "/home");
      
    } catch (err) {
      console.error("Full login error:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError(err.response.data.message || "Invalid credentials");
        } else if (err.response.status === 400) {
          setError(err.response.data.message || "Invalid input");
        } else if (err.response.status === 404) {
          setError("Login service not found. Please try again later.");
        } else if (err.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(err.response.data.message || "Login failed");
        }
      } else if (err.request) {
        setError("No response from server. Please check your internet connection.");
      } else {
        setError("Error making login request. Please try again.");
      }
    }
  };

  return (
    <div className='bg-white flex flex-col justify-center items-center mt-20 font-poppins'>
      {message && <div className="text-p font-poppins mb-4">{message}</div>}
        <div className="flex flex-col justify-center items-center md:bg-white md:p-12 md:shadow-md md:border md:rounded-md ">
          <img className="w-32 h-26 py-4" src={logo} alt="logo" />
          <div className="flex flex-col justify-center items-center">
            <p className='text-p font-bold font-poppins text-main'>Log in</p>
            <form className='flex flex-col justify-center items-center mt-8 gap-8' onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Email or Username:</label>
                <input
                  className="px-2 md:w-96 w-72 h-12 py-2 border border-iborder rounded-md"
                  placeholder='Enter your email or username'
                  type="text"
                  name="identifier"
                  value={user.identifier}
                  onChange={(e) => setUser({ ...user, identifier: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex font-poppins text-h3">Password:</label>
                <div className="flex flex-col">
                  <input
                    className="px-2 md:w-96 w-72 py-2 h-12 border border-iborder rounded-md"
                    placeholder="Enter your password"
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleChange}
                    required
                  />
                  <Link to="/forgot" className="self-end text-p">Forgot password</Link>
                </div>
              </div>
              {error && <p className="text-error">{error}</p>}
              <div className="flex flex-col justify-center items-center mt-6">
                <button className="bg-p hover:bg-p/90 text-h2 p-2 px-28 md:w-96 rounded-md text-white ">Log in</button>
                <div className="flex gap-2">
                  <p>Do not have an account?</p>
                  <Link to="/Signup" className='text-p'>Sign up</Link>
                </div>
              </div>
            <div className="">
              <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const { credential } = credentialResponse;
                      console.log("Google credential:", credential);

                      const userInfo = jwtDecode(credential);
                      console.log("Decoded user info:", userInfo);

                      const res = await axios.post(`${apiUrl}/api/google-login`, { token: credential });

                      localStorage.setItem("token", res.data.token);
                      localStorage.setItem("role", res.data.role);
                      if (res.data.passwordWasGenerated) {
                        navigate("/changePassword", { state: { firstTimeGoogleLogin: true } });
                      } else {
                      navigate(res.data.role === "admin" ? "/adminhome" : "/home");
                      }
                    } catch (err) {
                      console.error("Google Login Error:", err);
                      setError("Google Login Failed");
                    }
                  }}
                  onError={() => {
                    setError("Google Login Failed");
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}

export default Login;