import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeft } from 'lucide-react'
import Select from 'react-select';

const EditProfile = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    profilePicture: null,
    selectedServices: [],
    bio: "",
    latitude: null,
    longitude: null,
  });
  const navigate = useNavigate();
  const [previewImage, setPreviewImage] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ServiceRequestForm, setServiceRequestForm] = useState(false);
  const [serviceRequest, setServiceRequest] = useState({
    serviceName: "",
    description: ""
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [cityOptions, setCityOptions] = useState([]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = response.data;
      console.log("User Data:", userData);

      const userServices = userData.services || [];
      const serviceIds = userServices.map(service => 
        typeof service === 'object' ? service._id : service
      );
      setProfileData({
        username: userData.username || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "", 
        profilePicture: userData.profilePicture || null,
        selectedServices: serviceIds,
        bio: userData.bio || "",
      });

      if (userData.profilePicture && userData.profilePicture !== '') {
        const picturePath = userData.profilePicture.startsWith("http") 
          ? userData.profilePicture 
          : `${apiUrl}${userData.profilePicture}`;
        setPreviewImage(picturePath);
        console.log("Set profile picture preview:", picturePath);
      } else {
        setPreviewImage(null);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching profile:", err);
        toast.error("Error loading user profile.");
        setError("Failed to load profile data");
      }
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
  }, [apiUrl, token]);

  // Cleanup for preview image URLs
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const servicesData = response.data.services || [];
        console.log("Fetched services:", servicesData);
        setServices(servicesData);
      } catch (err) {
        console.error("Failed to fetch services:", err.response?.data || err);
        toast.error("Error loading services.");
      }
    };

    fetchServices();
  }, [apiUrl, token]);

  const validateForm = () => {
    if (!profileData.username.trim()) {
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

    if (name === "address") {
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(
        setTimeout(() => {
          const matches = cityOptions.filter((city) =>
            city.name.toLowerCase().includes(value.toLowerCase())
          );
          setAddressSuggestions(matches);
        }, 200)
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG)");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Image size should be less than 20MB");
        return;
      }

      setProfileData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
     
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(newPreviewUrl);
      console.log("Set new preview image:", newPreviewUrl);
      
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

  const handleServiceRequestChange = (e) => {
    const { name, value } = e.target;
    setServiceRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceRequest.serviceName.trim()) {
      toast.error("Service name is required");
      return;
    }
    
    setRequestSubmitting(true);
    
    try {
      await axios.post(`${apiUrl}/api/service-requests`, {
        serviceName: serviceRequest.serviceName.trim(),
        description: serviceRequest.description.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast.success("Service request submitted successfully!");
      setServiceRequest({ serviceName: "", description: "" });
      setServiceRequestForm(false);
    } catch (err) {
      const message = err.response?.data?.error || `Failed to submit service request: ${err.message}`;
      console.error("Error submitting service request:", err);
      toast.error(message);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const openServiceRequestForm = () => {
    setServiceRequestForm(true);
  };

  const closeServiceRequestForm = () => {
    setServiceRequestForm(false);
    setServiceRequest({ serviceName: "", description: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setError("");
    setLoading(true);

    const trimmedAddress = profileData.address.trim();
    const matchedCity = cityOptions.find(
      (city) => city.name.toLowerCase() === trimmedAddress.toLowerCase()
    );

    if (!matchedCity) {
      toast.error("Please select a valid city from suggestions.");
      setLoading(false);
      return;
    }
    profileData.latitude = matchedCity.lat;
    profileData.longitude = matchedCity.lng;

  if (matchedCity) {
    profileData.latitude = matchedCity.lat;
    profileData.longitude = matchedCity.lng;
  } else {
    const coordinates = await getCoordinatesFromAddress(trimmedAddress);
    if (coordinates) {
      profileData.latitude = coordinates.latitude;
      profileData.longitude = coordinates.longitude;
    }
  }
    const formData = new FormData();
    formData.append("username", profileData.username.trim());
    formData.append("email", profileData.email);
    formData.append("phone", profileData.phone.trim());
    formData.append("address", profileData.address.trim());
    formData.append("bio", String(profileData.bio || "").trim());
    formData.append("latitude", profileData.latitude);
    formData.append("longitude", profileData.longitude);

    if (profileData.profilePicture instanceof File) {
      formData.append("profilePicture", profileData.profilePicture);
    }
    profileData.selectedServices.forEach((serviceId) => {
      formData.append("services[]", serviceId);
    });
  
    try {
      const updateResponse = await axios.put(`${apiUrl}/api/editProfile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (updateResponse.data?.user) {
        const updatedUser = updateResponse.data.user;
        const updatedServices = Array.isArray(updatedUser.services) 
        ? updatedUser.services.map(service => 
            typeof service === 'object' ? service._id : service
          )
        : [];
        setProfileData({
          username: updatedUser.username || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
          profilePicture: updatedUser.profilePicture || null,
          selectedServices: updatedServices,
          bio: updatedUser.bio || "",
          address: updatedUser.name || "",
          latitude: updatedUser.lat || "",
          longitude: updatedUser.lng || "",
        });
        
        if (updatedUser.profilePicture && updatedUser.profilePicture !== '') {
          const picturePath = updatedUser.profilePicture.startsWith("http") 
            ? updatedUser.profilePicture 
            : `${apiUrl}${updatedUser.profilePicture}`;
          setPreviewImage(picturePath);
        }
        console.log("Updated user data:", updatedUser);
      }
      
      toast.success("Profile updated successfully!");
    } 
    catch (err) {
      const message = err.response?.data?.error || `Failed to update profile: ${err.message}`;
      console.error("Error updating profile:", err);
      setError(message);
      toast.error(message);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ServiceRequestForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [ServiceRequestForm]);

  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await axios.get(`${apiUrl}/api/address/suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: address,
        },
      });
      
      if (!response.data || response.data.length === 0) return null;

      const { lat, lon } = response.data[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };

    } catch (error) {
      console.error("Error getting coordinates:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/nepal-cities.json");
        const data = await response.json();
        setCityOptions(data);
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    };
  
    fetchCities();
  }, []);
  
  

  return (
    <div className="min-h-screen md:bg-neutral-100  flex flex-col font-poppins">
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md md:bg-white rounded-lg md:shadow-lg p-8">
        <div className="flex justify-start md:hidden">
      <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-p"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
      </div>
          <h1 className="text-h2 font-semi-bold text-center text-p mb-6">
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
                className="w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => document.getElementById("profilePicture").click()}
                role="button"
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
                    onError={(e) => {
                      console.error("Error loading profile image:", e);
                      e.target.onerror = null;
                      e.target.src = ''; 
                      setPreviewImage(null);
                    }}
                  />
                ) : (
                  <span className="text-s">Upload</span>
                )}
              </div>
              <button 
              type="button" 
              onClick={() => setBioModalOpen(true)} 
              className="text-p hover:underline text-h3 font-semi-bold p-2 hover:text-p/80"
            >
              Add Bio
            </button>
            </div>  
            <div>
              <label htmlFor="username" className="text-body font-regular mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full border rounded border-grey p-3"
                required
              />
            </div>
            {/* <div>
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
            </div> */}

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
            <div className="relative">
            <label htmlFor="address" className="text-body font-regular mb-2">
              Address
            </label>
            <input
            type="text"
            id="address"
            name="address"
            value={profileData.address || ""}
            onChange={(e) => {
              const value = e.target.value;
              setProfileData((prev) => ({ ...prev, address: value }));
              if (typingTimeout) clearTimeout(typingTimeout);
              setTypingTimeout(
                setTimeout(() => {
                  const matches = cityOptions.filter((city) =>
                    city.name.toLowerCase().includes(value.toLowerCase())
                  );
                  setAddressSuggestions(matches);
                }, 200)
              );
            }}
            placeholder="Type city name (e.g. Kathmandu)"
            className="w-full border rounded border-grey p-3"
          />
          {addressSuggestions.length > 0 && (
            <ul className="border border-gray-300 rounded-md mt-1 bg-white shadow-md absolute z-10 max-h-48 overflow-auto w-full">
              {addressSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setProfileData((prev) => ({
                      ...prev,
                      address: suggestion.name,
                      latitude: suggestion.lat,
                      longitude: suggestion.lng,
                    }));
                    setAddressSuggestions([]);
                  }}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
          </div>
            <div>
              <label
                htmlFor="services"
                className="text-body font-regular mb-2"
              >
                Services You Can Offer
              </label>
              <Select
              isMulti
              name="services"
              options={services.map(service => ({
                value: service._id,
                label: service.serviceName
              }))}
              value={services
                .filter(service => profileData.selectedServices.includes(service._id))
                .map(service => ({ value: service._id, label: service.serviceName }))
              }
              onChange={(selectedOptions) =>
                setProfileData(prev => ({
                  ...prev,
                  selectedServices: selectedOptions.map(opt => opt.value)
                }))
              }
              className="react-select-container"
              classNamePrefix="react-select"
            />
              <p className="text-grey text-h3 p-2">
                You can select multiple services.
              </p>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={openServiceRequestForm}
                  className="text-p hover:text-p/80 text-h3 font-medium underline"
                >
                Can't find a service? Request one
                </button>
              </div>
            </div>

            {error && <p className="text-error text-h3">{error}</p>}

            <button
              type="submit"
              className="w-full bg-p hover:bg-p/90 text-white rounded py-3 px-6 transition-colors"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
        <ToastContainer pauseOnHover theme="light" />
      </div>
      {ServiceRequestForm && (
        <div className="fixed inset-0 bg-dark-grey bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeServiceRequestForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <h2 className="text-h2 font-bold mb-4">Request a New Service</h2>
            
            <form onSubmit={handleServiceRequestSubmit} className="space-y-4">
              <div>
                <label htmlFor="serviceName" className=" font-semi-bold mb-2">
                  Service Name*
                </label>
                <input
                  type="text"
                  id="serviceName"
                  name="serviceName"
                  value={serviceRequest.serviceName}
                  onChange={handleServiceRequestChange}
                  placeholder="Enter service name"
                  className="w-full border rounded border-grey p-3"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="text-body font-semi-bold mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceRequest.description}
                  onChange={handleServiceRequestChange}
                  placeholder="Briefly describe this service"
                  className="w-full border rounded border-grey p-3"
                  rows="4"
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeServiceRequestForm}
                  className="flex-1 bg-white hover:bg-error/80 text-error border hover:text-white border-error rounded py-3 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-p hover:bg-p/90 text-white rounded py-3 px-4"
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {bioModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
          <button 
            onClick={() => setBioModalOpen(false)} 
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          <h3 className="text-lg font-semibold mb-4">Describe Yourself</h3>
          <textarea 
            className="w-full border border-gray-300 rounded-md p-3 mb-4" 
            rows="4"
            value={profileData.bio}
            onChange={(e) => setProfileData((prev) => ({
              ...prev,
              bio: String(e.target.value)
            }))}
          />
          <p className="text-right text-xs text-gray-500 mb-4">
            {profileData.bio.length}/300 characters
          </p>
          <button 
            onClick={() => setBioModalOpen(false)} 
            className="bg-p text-white px-4 py-2 rounded hover:bg-p/90 w-full"
          >
            Save
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default EditProfile;