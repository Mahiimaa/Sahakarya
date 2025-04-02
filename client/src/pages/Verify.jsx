import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation} from "react-router-dom";
import logo from "../assets/logo.png"; 

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const apiUrl = process.env.REACT_APP_API_BASE_URL

  useEffect(() => {
    console.log("Location state:", location.state);
    if (!email) {
      const storedEmail = sessionStorage.getItem("verificationEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        setStatus("error");
        setMessage("Email is missing. Please go back to signup.");
      }
    } else {
      sessionStorage.setItem("verificationEmail", email);
    }
  }, [email, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus("error");
      setMessage("Email is missing. Please go back to signup.");
      return;
    }
    
    if (!otp) {
      setStatus("error");
      setMessage("Please enter the OTP sent to your email");
      return;
    }
    
    try {
      setStatus("loading");
      setMessage("Verifying your email...");
      
      const response = await axios.post(`${apiUrl}/api/verify-email`, { email, otp });
      
      setStatus("success");
      setMessage(response.data.message);
      sessionStorage.removeItem("verificationEmail");
      setTimeout(() => {
        navigate("/", {
          state: {
            message: "Email verified successfully. Please log in."
          }
        });
      }, 3000);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Verification failed");
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Email is missing. Please go back to signup.");
      return;
    }
    
    try {
      setStatus("loading");
      setMessage("Sending new OTP...");
      
      const response = await axios.post(`${apiUrl}/api/resend-verification`, { email });
      
      setStatus("idle");
      setMessage(response.data.message);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-20 font-poppins">
      <div className="flex flex-col justify-center items-center">
        <img className="w-32 h-26 py-4" src={logo} alt="logo" />
        
        <div className="mt-4 p-6 rounded-lg w-96">
          <h2 className="text-xl font-semi-bold mb-4 text-center text-p">Verify Your Email</h2>
          
          {status === "success" ? (
            <div className="text-center">
              <p className="text-p mb-4">{message}</p>
              <p>Redirecting to login page...</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-center">
                Please enter the verification code sent to<br />
                <span className="font-semibold">{email}</span>
              </p>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex font-poppins text-h3">Verification Code:</label>
                  <input 
                    className="px-2 w-full h-12 py-2 border border-iborder rounded-md text-center text-2xl tracking-widest" 
                    placeholder="Enter 6-digit code" 
                    type="text" 
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
                
                {status === "error" && <p className="text-error text-center">{message}</p>}
                {status === "loading" && <p className="text-p text-center">{message}</p>}
                {(status === "idle" && message) && <p className="text-s text-center">{message}</p>}
                
                <button 
                  type="submit" 
                  className="bg-p hover:bg-p/90 text-h2 p-2 mt-4 rounded-md text-white"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Verifying..." : "Verify Email"}
                </button>
                
                <div className="text-center mt-2">
                  <button 
                    type="button"
                    onClick={handleResendOTP}
                    className="text-p hover:underline"
                    disabled={status === "loading"}
                  >
                    Resend verification code
                  </button>
                </div>
              </form>
              
              <div className="mt-4 text-center">
                <Link to="/" className="text-p">Return to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Verify;
