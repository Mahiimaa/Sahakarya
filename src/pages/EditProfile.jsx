import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { NavLink } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const EditProfile = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: null,
    selectedServices: [],
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          signal: controller.signal,
        });
        const userData = response.data.user;
  
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          profilePicture: userData.profilePicture || null,
          selectedServices: userData.services || [],
        });
  
        if (userData.profilePicture) {
          setPreviewImage(
            userData.profilePicture.startsWith("http") 
              ? userData.profilePicture 
              : `${apiUrl}${userData.profilePicture}`
          );
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          toast.error("Error loading user profile.");
          setError("Failed to load profile data");
        }
      }
      return () => controller.abort();
    };
  
    fetchUserProfile();
  }, [apiUrl, token]);
  

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/services`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setServices(response.data.services); 
      } catch (err) {
        console.error("Failed to fetch services:", err);
        toast.error("Error loading services.");
      }
    };

    fetchServices();
  }, [apiUrl, token]);

  const validateForm = () => {
    if (!profileData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!profileData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG, or GIF)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setProfileData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleServiceChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setProfileData((prev) => ({
      ...prev,
      selectedServices: selectedOptions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setError("");

    const formData = new FormData();
    formData.append("name", profileData.name.trim());
    formData.append("email", profileData.email);
    formData.append("phone", profileData.phone.trim());
    if (typeof profileData.profilePicture !== "string") {
      formData.append("profilePicture", profileData.profilePicture);
    }
    profileData.selectedServices.forEach((service) => {
      formData.append("services[]", service);
    });

    try {
      await axios.put(`${apiUrl}/api/editProfile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to update profile.";
      setError(message);
    }
  };

  return (
    <div className=" min-h-screen bg-neutral-100 py-8 px-4 flex flex-col">
    <div className="flex justify-start">
    <button className="bg-p text-white rounded py-2 px-4">
      <NavLink to="/userProfile" className="flex items-center">
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
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-h2 font-bold text-center text-p mb-6">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center">
            <label
              htmlFor="profilePicture"
              className="text-poppins font-semibold mb-2"
            >
              Profile Picture
            </label>
            <input
              type="file"
              id="profilePicture"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Upload profile picture"
            />
            <div
              className="w-24 h-24 rounded-full border-2 border-neutral-300 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() =>
                document.getElementById("profilePicture").click()
              }role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  document.getElementById("profilePicture").click();
                }
              }}
              aria-label="Click to upload profile picture"
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-s">Upload</span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="text-body font-regular mb-2">
              Username
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full border rounded border-grey p-3"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="text-body font-regular mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              className="w-full border rounded border-grey p-3"
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="text-body font-regular mb-2"
            >
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full border rounded border-grey p-3"
              required
            />
          </div>

          <div>
            <label
              htmlFor="services"
              className="text-body font-regular mb-2"
            >
              Services You Can Offer
            </label>
            <select
              id="services"
              name="services"
              multiple
              value={profileData.selectedServices}
              onChange={handleServiceChange}
              className="w-full border rounded border-grey p-3"
            >
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
            <p className="text-grey text-h3 mt-1">
              Hold <kbd>Ctrl</kbd> (Windows) or <kbd>Cmd</kbd> (Mac) to select
              multiple options.
            </p>
          </div>

          {error && <p className="text-error text-h3">{error}</p>}

          <button
            type="submit"
            className="w-full bg-p text-white rounded py-3 px-6 hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
      <ToastContainer pauseOnHover theme="light" />
    </div>
    </div>
  );
};

export default EditProfile;
