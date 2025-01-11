import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { IoChevronBackOutline } from "react-icons/io5";

const Reset = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const { email, resetToken } = location.state || {};
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot');
    }
  }, [email, resetToken, navigate]);

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

  
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/resetPassword`,
        { 
          email,
          password,
          resetToken
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.passwordChanged) {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.data.error || "Failed to reset password");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message === "Network Error") {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setError("Failed to reset password. Please try again later.");
      }
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center relative">
      <Link 
        to="/forgot"
        className="hidden desk:absolute desk:left-16 desk:top-16 bg-p text-white border-2 border-button desk:flex justify-center items-center px-6 py-2 text-xl font-medium text-button gap-2 hover:bg-button"
      >
        <IoChevronBackOutline /> Back
      </Link>

      <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 justify-center items-center p-4 w-full max-w-md"
      >
        <p className="font-poppins font-bold text-main text-p text-xl">Set New Password</p>

        <div className="flex flex-col gap-2 w-full">
          <label className="font-poppins text-s">New Password:</label>
          <input
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-iborder px-6 py-3 outline-none rounded-md focus:border-blue-500"
            required
            autoFocus
            minLength={8}
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="font-poppins text-s">Confirm Password:</label>
          <input
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-iborder px-6 py-3 outline-none rounded-md focus:border-blue-500"
            required
            minLength={8}
          />
        </div>

        {error && (
          <p className="text-error text-sm w-full text-center">{error}</p>
        )}
        {success && (
          <p className="text-p text-sm w-full text-center">{success}</p>
        )}

        <button
          type="submit"
          className="border outline-none bg-p rounded-md text-white px-6 py-2 hover:bg-button w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default Reset;