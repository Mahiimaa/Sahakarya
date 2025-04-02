import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { IoTrash, IoPencil, IoClose, IoTimer, IoWallet, IoSearch } from "react-icons/io5";

function UserServices() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [userServices, setUserServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceImage, setServiceImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [duration, setDuration] = useState("");
  const [timeCredits, setTimeCredits] = useState("");

  useEffect(() => {
    const fetchUserServices = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/my-services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserServices(response.data.services);
      } catch (err) {
        console.error("Error fetching user services:", err);
        setError("Failed to load your services.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserServices();
  }, [apiUrl, token]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(userServices);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = userServices.filter(
        (service) =>
          (service.title && service.title.toLowerCase().includes(lowercasedSearch)) ||
          (service.description && service.description.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, userServices]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleEditClick = (service) => {
    setSelectedService(service);
    setServiceTitle(service.title || "");
    setServiceDescription(service.description || "");
    setPreviewImage(service.image ? `${apiUrl}${service.image}` : "");
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

  const handleSaveChanges = async () => {
    if (!selectedService) return;

    try {
      const formData = new FormData();
      formData.append("title", serviceTitle);
      formData.append("description", serviceDescription);
      formData.append("duration", duration);
      formData.append("timeCredits", timeCredits);
      if (serviceImage) {
        formData.append("image", serviceImage);
      }

      await axios.put(`${apiUrl}/api/user/services/${selectedService.serviceId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      toast.success("Service updated successfully!");

      setUserServices((prevServices) =>
        prevServices.map((service) =>
          service.serviceId === selectedService.serviceId
            ? { ...service, title: serviceTitle, description: serviceDescription, image: previewImage,  duration: duration,
              timeCredits: timeCredits }
            : service
        )
      );

      setShowModal(false);
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service.");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await axios.delete(`${apiUrl}/api/user/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserServices((prevServices) => prevServices.filter((service) => service.serviceId !== serviceId));
      toast.success("Service deleted successfully!");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-poppins bg-screen">
      <Navbar />
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full flex-grow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-4">
        <h1 className="text-h2 font-semi-bold mt-6 mb-4">My Service Details</h1>

        {userServices.length > 0 && (
            <div className="relative w-full sm:w-64 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoSearch className="text-dark-grey" />
              </div>
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-10 py-2 w-full border border-dark-grey rounded-md focus:outline-none focus:ring-2 focus:ring-p focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-grey hover:text-p"
                >
                  <IoClose />
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-dark-grey">Loading...</p>
          </div>
        ) : error ? (
          <p className="text-error py-4">{error}</p>
        ) : userServices.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-dark-grey mt-4">You have not added any service details.</p>
            <button 
              className="mt-4 bg-p hover:bg-p/90 text-white px-4 py-2 rounded-md"
              onClick={() => navigate('/add-service')}
            >
              Add Service
            </button>
          </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-dark-grey">No services match your search.</p>
                <button 
                  className="mt-4 bg-p hover:bg-p/90 text-white px-4 py-2 rounded-md"
                  onClick={clearSearch}
                >
                  Clear Search
                </button>
              </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4 pb-8">
            {filteredServices.map((service) => (
              <div key={service.serviceId} className="flex flex-col p-4 border border-dark-grey rounded-lg bg-white shadow-md h-full">
                <div className="relative mb-3 w-full pt-[60%]">
                  {service.image ? (
                    <img
                      src={`${apiUrl}${service.image}`}
                      alt={service.title}
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full bg-grey flex items-center justify-center rounded-md">
                      <p className="text-dark-grey">No Image</p>
                    </div>
                  )}
                </div>

                <h3 className="font-semi-bold text-h3 mb-2">{service.title}</h3>
                <p className=" flex-grow mb-3 line-clamp-3">{service.description}</p>
                
                {/* Added service details for duration and time credits */}
                <div className="flex flex-col gap-1 mb-3">
                  {service.duration && (
                    <div className="flex items-center gap-1">
                      <IoTimer className="text-p" />
                      <span>{service.duration} hours</span>
                    </div>
                  )}
                  {service.timeCredits && (
                    <div className="flex items-center gap-1">
                      <IoWallet className="text-p" />
                      <span>{service.timeCredits} time credits</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <button
                    className="flex items-center justify-center gap-1 text-p bg-white border border-p px-3 py-1 rounded-md hover:bg-p hover:text-white flex-1"
                    onClick={() => handleEditClick(service)}
                  >
                    <IoPencil /> Edit
                  </button>
                  <button
                    className="flex items-center justify-center gap-1 text-error bg-white border border-error px-3 py-1 rounded-md hover:bg-error hover:text-white flex-1"
                    onClick={() => handleDeleteService(service.serviceId)}
                  >
                    <IoTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-dark-grey bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white p-5 rounded-md w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2 font-semi-bold">Edit Service</h2>
              <button className="text-xl" onClick={() => setShowModal(false)}>
                <IoClose />
              </button>
            </div>

            <div className="space-y-4">
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
                <label className="text-h3 font-semi-bold block mb-1">Duration (hours)</label>
                <input
                  className="w-full border rounded-md p-2"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Service duration in hours"
                />
              </div>
              
              <div>
                <label className="text-h3 font-semi-bold block mb-1">Time Credits</label>
                <input
                  className="w-full border rounded-md p-2"
                  type="number"
                  value={timeCredits}
                  onChange={(e) => setTimeCredits(e.target.value)}
                  placeholder="Time credits required"
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
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="Service Preview" 
                      className="mt-2 max-h-40 mx-auto rounded-md" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button 
                className="bg-light-grey hover:bg-error/40 text-error px-4 py-2 rounded-md mr-3"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded-md" 
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserServices;
