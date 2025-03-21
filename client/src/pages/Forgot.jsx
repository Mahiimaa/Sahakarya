import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBackOutline } from "react-icons/io5";
import axios from "axios";

const Forgot = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [emailBoxVisiblity, setEmailFormVisiblity] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(false);
  const navigate = useNavigate();
  
  const inputRefs = useRef([]);
  if (inputRefs.current.length === 0) {
    inputRefs.current = Array(6).fill(null);
  }

  useEffect(() => {
    let interval;
    if (showOtp && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      setError("OTP has expired. Please request a new one.");
    }
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(""); 
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${apiUrl}/api/requestOTP`,
        { email },
        { withCredentials: true }
      );

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccessMessage("OTP sent successfully! Please check your email.");
        setEmailFormVisiblity(false);
        setShowOtp(true);
        setTimer(60);
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30000);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("There was an issue processing your request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");


      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split("").forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleBack = () => {
    if (emailBoxVisiblity && !showOtp) {
      navigate("/");
    } else if (!emailBoxVisiblity && showOtp) {
      setEmailFormVisiblity(true);
      setShowOtp(false);
      setOtp(new Array(6).fill(""));
      setError("");
      setSuccessMessage("");
      setTimer(60);
    }
  };

  const handleResendOTP = () => {
    if (!resendDisabled) {
      handleEmailSubmit({ preventDefault: () => {} });
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (timer === 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all digits of the OTP");
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/submitOTP`,
        { otp: otpValue, email },
        { withCredentials: true }
      );

      if (response.data.resetToken) {
        navigate("/reset", { 
          state: { 
            email,
            resetToken: response.data.resetToken 
          } 
        });
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Invalid OTP. Please try again.");
      }
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const renderOtpInputs = () => {
    return otp.map((digit, index) => (
      <input
        key={index}
        ref={el => inputRefs.current[index] = el}
        type="text"
        value={digit}
        onChange={(e) => handleChange(index, e)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        className="w-14 h-14 border border-p outline-none text-2xl text-center rounded focus:border-blue-500"
        maxLength={1}
        disabled={timer === 0}
        aria-label={`OTP digit ${index + 1}`}
      />
    ));
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center relative">
      <button
        className="hidden desk:absolute desk:left-16 desk:top-16 bg-p hover:bg-p/90 text-white border-2 border-button desk:flex justify-center items-center px-6 py-2 text-xl font-medium text-button gap-2"
        onClick={handleBack}
      >
        <IoChevronBackOutline /> Back
      </button>

      {emailBoxVisiblity && (
        <form
          onSubmit={handleEmailSubmit}
          className="flex flex-col gap-6 justify-center items-center p-4"
        >
          <p className="font-poppins font-bold text-main text-p">Forgot Password?</p>
          <p className="font-poppins text-s">Enter your email</p>
          <input
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={handleEmailChange}
            className="border border-iborder px-6 py-3 outline-none rounded-md focus:border-blue-500"
            required
            autoFocus
          />
          <button
            className="border outline-none bg-p hover:bg-p/90 rounded-md text-white px-6 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending..." : "Request OTP"}
          </button>
          {error && <p className="text-error text-sm">{error}</p>}
          {successMessage && <p className="text-p text-sm">{successMessage}</p>}
        </form>
      )}

      {showOtp && (
        <div className="flex flex-col gap-4 items-center p-4">
          <h1 className="text-xl text-center">Enter the OTP sent to your email</h1>
          <form className="flex flex-col gap-4 items-center" onSubmit={handleOTPSubmit}>
            <div className="flex gap-4">
              {renderOtpInputs()}
            </div>
            <p className="text-dark-grey">* Your OTP expires in <span className="text-error">{timer}s</span></p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex flex-col gap-2 items-center">
              <button
                type="submit"
                className="bg-p text-white w-fit px-6 py-2 rounded hover:bg-p/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={timer === 0}
              >
                Verify OTP
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                className={`text-sm ${resendDisabled ? 'text-grey cursor-not-allowed' : 'text-p hover:text-p'}`}
                disabled={resendDisabled}
              >
                Resend OTP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Forgot;