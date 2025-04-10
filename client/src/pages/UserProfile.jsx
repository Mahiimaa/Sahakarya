import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeft } from 'lucide-react'
import { useParams } from "react-router-dom";

const UserProfileInfoPage = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceImage, setServiceImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [duration, setDuration] = useState("");
  const [timeCredits, setTimeCredits] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
          console.log('Token:', token);
          if (!token) {
            navigate('/login'); 
            return;
          }
          try{
          const current = await axios.get(`${apiUrl}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(current.data);
          const targetId = userId || current.data._id;
          setIsOwner(targetId === current.data._id || targetId === current.data.id);

          const { data } = await axios.get(`${apiUrl}/api/users/${targetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setUser(data);
          if (Array.isArray(data.servicesOffered)) {
            setSelectedServices(data.servicesOffered);
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load user information.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [navigate, apiUrl, userId]);

  const openEditProfile = () => {
    navigate('/editProfile');
  };

  const openTimeCredit = () => {
    navigate('/timeCredit');
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setServiceTitle(service.title || service.serviceName || ""); 
    setServiceDescription(service.description || "");
    setPreviewImage(service.image || "");
    setDuration(service.duration || "");
    setTimeCredits(service.timeCredits || "");
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setServiceImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveDescription = async () => {
    if (!selectedService) return;

  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("title", serviceTitle);
    formData.append("description", serviceDescription);
    formData.append("duration", duration);
    formData.append("timeCredits", timeCredits);
    if (serviceImage) {
      formData.append("image", serviceImage);
    }
    await axios.post(`${apiUrl}/api/user/services/${selectedService._id}`, 
      formData,
      { headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
      } }
    );
    toast.success("Service details added successfully!");
    setSelectedServices((prev) =>
      prev.map((service) =>
        service._id === selectedService._id
          ? { ...service, title: serviceTitle, description: serviceDescription, duration, timeCredits, image: previewImage }
          : service
      )
    );
   
    setShowModal(false);
  } catch (error) {
    console.error("Error updating service description:", error);
  }
};

  const closeModal = () => {
    setShowModal(false);
    setServiceTitle("");
    setServiceDescription("");
    setDuration("");
    setTimeCredits("");
    setServiceImage(null);
    setPreviewImage("");
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;


  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col md:bg-screen font-poppins">
      <div className="flex justify-start md:hidden p-4">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-p"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span>Back</span>
              </button>
            </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full sm:w-4/5 md:w-3/4 lg:w-3/5 xl:w-2/5 mx-auto md:bg-white md:shadow-lg rounded-lg p-4 sm:p-6">
          <p className="text-center text-p text-h2 font-semi-bold p-2 sm:p-4">User Profile</p>
          
          {/* Profile Picture */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden border-2">
              <img
                src={user?.profilePicture || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-poppins text-s font-semi-bold mt-4">{user?.username}</h1>
            <div className="text-center ">
              <p
                onClick={isOwner ? openTimeCredit : undefined}
                className={isOwner ? "text-h3 font-semi-bold hover:text-p hover:underline cursor-pointer" : ""}
              >
                Time Credits: {user?.timeCredits || 0}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="flex flex-col sm:flex-row justify-between border-t px-4 sm:px-8">
            <div className="sm:w-1/2">
              <h2 className="text-h2 font-semi-bold mb-3">Personal Information</h2>
              <div className="flex flex-col gap-3">
              <p>
                <strong>Bio:</strong>{" "}
                {user.bio.length > 150 && !showFullBio
                  ? `${user.bio.slice(0, 150)}... `
                  : user.bio}
                {user.bio?.length > 150 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-p underline text-sm ml-1"
                  >
                    {showFullBio ? "Show less" : "Read more"}
                  </button>
                )}
              </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {user?.phone || "Not provided"}
                </p>
                <p>
                  <strong>Address:</strong> {user?.address || "Not provided"}
                </p>
              </div>
            </div>

            {/* Services Offered */}
            <div className="sm:w-1/3">
              <NavLink to="/my-services" className="hover:text-p hover:underline text-h2 font-semi-bold mb-3 block whitespace-nowrap">
                Services Offered
              </NavLink>
              {selectedServices.length > 0 ? (
                <ul className="list-disc list-inside">
                  {selectedServices.map((service, index) => (
                    <li 
                      key={service._id || index} 
                      className="text-body hover:text-p cursor-pointer" 
                      onClick={() => isOwner && handleServiceClick(service)}
                    >
                      {service.serviceName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No services offered yet.</p>
              )}
            </div>
          </div>
          {isOwner && (
          <div className="flex justify-center mt-4">
            <button 
              className="bg-p hover:bg-p/90 p-2 text-white border rounded-md w-full sm:w-auto sm:px-4" 
              onClick={openEditProfile}
            >
              Edit Profile
            </button>
          </div>
          )}
        </div>
      </div>
      
      {/* Service Details Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-dark-grey bg-opacity-50 flex items-center justify-center p-4 z-50" 
          onClick={closeModal}
        >
          <div 
            className="bg-white p-4 sm:p-6 rounded-md w-full max-w-md relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2 font-semi-bold">Add Service Details</h2>
              <button className="text-xl" onClick={closeModal}>
                <IoClose size={24} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Title</label>
                <input
                  className="w-full border rounded-md p-2"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="Service Title"
                />
              </div>
              
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Description</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="4"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe your service..."
                ></textarea>
              </div>
              
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Duration</label>
                <input 
                  className="w-full border rounded-md p-2" 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                  placeholder="Duration (in hours)" 
                />
              </div>
              
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Time Credits</label>
                <input 
                  className="w-full border rounded-md p-2" 
                  type="number" 
                  value={timeCredits} 
                  onChange={(e) => setTimeCredits(e.target.value)} 
                  placeholder="Time Credits" 
                />
              </div>
              
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Service Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full border p-2 rounded-md" 
                />
                {previewImage && (
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={previewImage || "/placeholder.svg"} 
                      alt="Service Preview" 
                      className="mt-2 w-32 h-32 object-contain rounded-md" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button 
                className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded-md" 
                onClick={handleSaveDescription}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer pauseOnHover theme="light" />
    </div>
  );
};

export default UserProfileInfoPage;
