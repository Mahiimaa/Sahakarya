import axios from "axios";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { Icon } from "react-icons-kit";
import { eyeOff } from "react-icons-kit/feather/eyeOff";
import { eye } from "react-icons-kit/feather/eye";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ChangePassword = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const location = useLocation();
  const isFirstTimeGoogleLogin = location.state?.firstTimeGoogleLogin;
  const [password, setPassword] = useState({
    current_password: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    current_password: false,
    password: false,
    confirm_password: false,
  });

  const [error, setError] = useState("");

  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/forgot");
  };

  const validatePasswords = () => {
    const { password: newPassword, confirm_password } = password;

    if (newPassword !== confirm_password) {
      setError("New password and confirm password do not match.");
      return false;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    try {
      const response = await axios.put(
        `${apiUrl}/api/changePassword`,
        {
          current_password: password.current_password,
          new_password: password.password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Password changed successfully!");
      setTimeout(() => navigate("/explore"), 3000);
      goBack();
    } catch (error) {
      const message = error.response?.data?.error || "Something went wrong. Please try again.";
    setError(message);
  }
  };

  const handleChange = (e) => {
    setError("");
    setPassword((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4 flex flex-col font-poppins">
      {isFirstTimeGoogleLogin && (
        <p className="text-blue-500 text-center mb-4">
          Please set a password for your account so you can log in without Google next time.
        </p>
      )}
      <div className="flex justify-start mb-8">
        <button className="bg-p hover:bg-p/90 text-white rounded py-2 px-4">
          <NavLink to="/home" className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </NavLink>
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-h2 font-bold mb-6 text-center text-p">
            Change Password
          </h1>

          <form onSubmit={handleSubmit} className="">
            <div className=" flex flex-col gap-3 ">
              <div className="flex flex-col relative">
                <label
                  htmlFor="current-password"
                  className="text-h3 font-semibold mb-2"
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type={showPassword.current_password ? "text" : "password"}
                  name="current_password"
                  className="border rounded  p-3 focus:outline-dark-grey "
                  placeholder="Enter current password"
                  onChange={handleChange}
                  value={password.current_password}
                  autoFocus
                />
                <span
                  className="absolute right-4 top-11  cursor-pointer"
                  onClick={() => togglePasswordVisibility("current_password")}
                >
                  <Icon
                    icon={showPassword.current_password ? eye : eyeOff}
                    size={20}
                    style={{ color: "#9CA3AF" }}
                  />
                </span>
              </div>

              <div className="flex flex-col relative">
                <label
                  htmlFor="new-password"
                  className="text-h3 font-semibold mb-2"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type={showPassword.password ? "text" : "password"}
                  name="password"
                  className="border rounded  p-3 focus:outline-dark-grey"
                  placeholder="Enter new password"
                  onChange={handleChange}
                  value={password.password}
                />
                <span
                  className="absolute right-4 top-11 cursor-pointer"
                  onClick={() => togglePasswordVisibility("password")}
                >
                  <Icon
                    icon={showPassword.password ? eye : eyeOff}
                    size={20}
                    style={{ color: "#9CA3AF" }}
                  />
                </span>
              </div>

              <div className="flex flex-col relative ">
                <label
                  htmlFor="confirm-password"
                  className="text-h3 font-semibold mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword.confirm_password ? "text" : "password"}
                  name="confirm_password"
                  className="border rounded  p-3 focus:outline-dark-grey"
                  placeholder="Confirm new password"
                  onChange={handleChange}
                  value={password.confirm_password}
                />
                <span
                  className="absolute right-4 top-11 cursor-pointer"
                  onClick={() => togglePasswordVisibility("confirm_password")}
                >
                  <Icon
                    icon={showPassword.confirm_password ? eye : eyeOff}
                    size={20}
                    style={{ color: "#9CA3AF" }}
                  />
                </span>
              </div>
              {error ? (
                <span className="text-error mt-2">{error}</span>
              ) : (
                <></>
              )}
              <button
                type="submit"
                className="w-full mt-4 bg-p hover:bg-p/90 text-white rounded py-3 px-6 transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer pauseOnHover theme="light" />
    </div>
  );
};

export default ChangePassword;
