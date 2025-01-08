import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoChevronBackOutline } from "react-icons/io5";
import axios from "axios";

const Forgot = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [email, setEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [emailBoxVisiblity, setEmailFormVisiblity] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // For error handling
  const [timer, setTimer] = useState(60); // Timer for OTP expiry

  const navigate = useNavigate();

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
  };

  const handleChange = (index, event) => {
    const { value } = event.target;
    if (/^\d?$/.test(value)) {
      const otpArray = otp.split("");
      otpArray[index] = value;
      setOtp(otpArray.join(""));

      if (value && index < inputRefs.length - 1) {
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(
        `${apiUrl}/api/requestOTP`,
        { email },
        { withCredentials: true }
      );
  
      if (response.data.error) {
        alert(response.data.error);  // Show error message to user if there's an issue
      } else {
        setEmailFormVisiblity(false);
        setShowOtp(true);
      }
  
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert("There was an issue processing your request. Please try again later.");
    }
  };
  
  const handleBack = () => {
    if (emailBoxVisiblity && !showOtp) {
      navigate("/");
    } else if (!emailBoxVisiblity && showOtp) {
      setEmailFormVisiblity(true);
      setShowOtp(false);
      setOtp(""); // Reset OTP state
      inputRefs.forEach((ref) => ref.current && (ref.current.value = ""));
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset errors
    try {
      const response = await axios.post(
        `${apiUrl}/api/submitOTP`,
        { otp, email },
        { withCredentials: true }
      );

      if (response.status === 200) {
        navigate("/reset", { state: { email } });
      }
    } catch (error) {
      console.log(error);
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center relative ">
      <button
        className="hidden desk:absolute desk:left-16 desk:top-16 bg-p text-white border-2 border-button desk:flex justify-center items-center px-6 py-2 text-xl font-medium text-button gap-2"
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
            autoFocus
            onChange={handleEmailChange}
            className="border border-iborder px-6 py-3 outline-none rounded-md"
            required
          />
          <button
            className="border outline-none bg-p rounded-md text-white px-2 py-2"
            disabled={loading}
          >
            {loading ? "Loading..." : "Request OTP"}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      )}

      {showOtp && (
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-xl">Enter the OTP sent to your email</h1>
          <form className="flex flex-col gap-4" onSubmit={handleOTPSubmit}>
            <div className="flex gap-6">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  className="w-14 h-14 border-2 border-border outline-none text-2xl text-center"
                  type="text"
                  value={otp[index] || ""}
                  onChange={(event) => handleChange(index, event)}
                  maxLength="1"
                  disabled={timer === 0} // Disable input if OTP expired
                />
              ))}
            </div>

            <p className="text-red-500">* Your OTP expires in {timer}s</p>
            {error && <p className="text-red-500">{error}</p>}

            <button
              className="bg-p text-white w-fit px-6 py-3 rounded flex self-center"
              type="submit"
              disabled={timer === 0}
            >
              Verify OTP
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Forgot;
