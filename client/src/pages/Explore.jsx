import React, {useEffect, useState} from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom";
import axios from "axios"
import { IoClose } from "react-icons/io5";
import {toast} from "react-toastify";
import { Filter, Search, Plus} from "lucide-react"

function Explore() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]); 
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allServiceDetails, setAllServiceDetails] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userServices, setUserServices] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDuration, setTaskDuration] = useState('');
  const [taskCredits, setTaskCredits] = useState('');
  const [taskImage, setTaskImage] = useState(null);

      useEffect(() => {
        const fetchUserServices = async () => {
          try {
            const { data } = await axios.get(`${apiUrl}/api/user/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUserServices(data.services || []);
          } catch (err) {
            console.error("Failed to fetch user services:", err);
          }
        };

        if (showTaskModal) {
          fetchUserServices();
        }
      }, [showTaskModal]);

  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setServices(data.services);
        setFilteredServices(data.services);
        const uniqueCategories = ['All', ...new Set(data.services.map(service => service.category.categoryName))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, [apiUrl]);

  useEffect(() => {
    const fetchAllServiceDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/allServices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("All services from backend:", data.services);
        setAllServiceDetails(data.services);
      } catch (error) {
        console.error("Error fetching all service details:", error);
      }
    };
    fetchAllServiceDetails();
  }, [apiUrl]);

  useEffect(() => {
    let filtered = services.filter(service =>
      (selectedCategory === 'All' || service.category.categoryName === selectedCategory) &&
      service.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [selectedCategory, searchQuery, services]);

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const validServices = allServiceDetails.filter(service =>
    service.serviceName &&
    service.description &&
    service.duration &&
    service.timeCredits &&
    Array.isArray(service.providers) &&
    service.providers.length > 0 
  );

  const closeTaskModal = () => {
    setShowTaskModal(false);
  }
  

  return (
    <div className = "flex flex-col font-poppins">
        <Navbar />
        <div className="flex flex-col md:flex-row p-4 mx-4 md:mx-8 lg:mx-16 xl:mx-28 gap-4">
        {/* Mobile Filter Toggle */}
        <button
          className="md:hidden flex items-center justify-center gap-2 p-3 mb-4 bg-p text-white rounded-lg w-full"
          onClick={toggleFilters}
        >
          <Filter size={18} />
          <span>Filter Categories</span>
        </button>
        <div
          className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-1/5 lg:w-1/6 p-4 bg-light-grey rounded-lg sticky top-4 self-start`}
        >
          <h2 className="text-lg font-semi-bold mb-4">Categories</h2>
          <div className="flex flex-wrap md:flex-col gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`flex p-2 text-left rounded-lg ${
                  selectedCategory === category ? "bg-p text-white" : "bg-white"
                } w-auto md:w-full`}
                onClick={() => {
                  setSelectedCategory(category)
                  if (window.innerWidth < 768) {
                    setShowFilters(false)
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:flex-1 px-0 md:px-4">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-end gap-3">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search services..."
              className="pl-10 p-2 w-full border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
            <div className="relative flex-grow sm:flex-grow-0 sm:w-36">
            <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4" />
            <button
            className="pl-10 w-full border  bg-p text-white p-2 rounded-lg hover:bg-p/90"
            onClick={() => setShowTaskModal(true)}
          >
            Post Task
          </button>
          </div>
          </div>

          <h2 className="text-h2 font-semi-bold mb-2 font-poppins">Featured Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="p-4 border border-dark-grey rounded-lg shadow-lg bg-white hover:-translate-y-1.5 transition-transform flex flex-col h-full cursor-pointer"
                  onClick={() => navigate(`/explore/services/${service._id}`)}
                >
                  <h3 className="font-semi-bold text-lg font-poppins ">{service.serviceName}</h3>
                  <p className="text-dark-grey">{service.category.categoryName}</p>
                </div>
              ))
            ) : (
              <p className="text-dark-grey col-span-full">No services found.</p>
            )}
          </div>

          <h2 className="text-h2 font-semi-bold mt-8 mb-2 font-poppins">All Services</h2>
          <div className="grid   lg:grid-cols-3 gap-4 md:gap-6">
            {validServices.length > 0 ? (
              validServices.map((service) => (
                <div
                  key={service.serviceId || service._id}
                  className="p-4 border border-dark-grey rounded-lg shadow-lg bg-white hover:-translate-y-1.5 transition-transform flex flex-col h-full cursor-pointer"
                  onClick={() => {
                    if (service.providers && service.providers.length > 0) {
                      navigate(
                        `/explore/provider-details/${service.providers[0]._id}?serviceId=${service.serviceId || service._id}`,
                      )
                    } else {
                      console.error("No provider available for this service.")
                      toast.error("No provider available for this service.")
                    }
                  }}
                >
                  <div className="overflow-hidden rounded-t-lg" style={{ height: "200px" }}>
                    <img
                      src={service.image?.startsWith("http") ? service.image : `${apiUrl}${service.image}`}
                      alt={service.serviceName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=200"
                        e.target.className = "w-full h-full object-contain p-4"
                      }}
                    />
                  </div>

                  {service.providers && service.providers.length > 0 && (
                    <div className="flex items-center gap-3 mb-3">
                      {service.providers[0].profilePicture && (
                        <img
                          src={`${apiUrl}${service.providers[0].profilePicture}`}
                          alt="Provider"
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex flex-col">
                        <h4 className="font-bold">{service.providers[0].username}</h4>
                      </div>
                    </div>
                  )}

                  <h3 className="font-semi-bold text-h3">{service.serviceName}</h3>
                  <p className="text-h3 line-clamp-2 hover:underline">{service.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-semi-bold text-h3">{service.duration || "N/A"} hours</span>
                    <span className="font-semi-bold text-h3">{service.timeCredits || "N/A"} credits</span>
                  </div>
                  <button
                    className="mt-4 bg-p text-white p-2 rounded-lg w-full hover:bg-p/90 active:bg-p/80 transition-colors"
                    onClick={async (e) => {
                      e.stopPropagation()
                      try {
                        console.log("Sending request for:", {
                          serviceId: service.serviceId || service._id,
                          providerId: service.providers[0]?._id,
                        })

                        await axios.post(
                          `${apiUrl}/api/bookings`,
                          { serviceId: service.serviceId || service._id, providerId: service.providers[0]?._id },
                          { headers: { Authorization: `Bearer ${token}` } },
                        )
                        toast.success("Service requested successfully!")
                      } catch (error) {
                        console.error(error.response?.data?.error || "Error requesting service")
                        toast.error(error.response?.data?.error || "Error requesting service")
                      }
                    }}
                  >
                    Request Service
                  </button>
                </div>
              ))
            ) : (
              <p className="text-dark-grey col-span-full">No services found.</p>
            )}
            {showTaskModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setShowTaskModal(false)}>
                <div className="bg-white p-6 rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Post New Task</h2>
                  <button className="text-xl" onClick={closeTaskModal}>
                    <IoClose size={24} />
                  </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold">Select Service</label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                      >
                        <option value="">-- Choose a service --</option>
                        {userServices.map((service) => (
                          <option key={service._id} value={service._id}>{service.serviceName}</option>
                        ))}
                      </select>
                      <p className= "text-grey font-regular">Make sure you have selected the services in your profile first.</p>
                    </div>
                    <div>
                      <label className="block font-semibold">Title</label>
                      <input
                        className="w-full border rounded-md p-2"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Description</label>
                      <textarea
                        className="w-full border rounded-md p-2"
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                        placeholder="Describe the task"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Duration (hrs)</label>
                      <input
                        type="number"
                        className="w-full border rounded-md p-2"
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Time Credits</label>
                      <input
                        type="number"
                        className="w-full border rounded-md p-2"
                        value={taskCredits}
                        onChange={(e) => setTaskCredits(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold">Upload Image</label>
                      <input
                        type="file"
                        onChange={(e) => setTaskImage(e.target.files[0])}
                        className="w-full border p-2 rounded-md"
                      />
                    </div>
                    {taskImage && (
                      <div className="mt-2 flex justify-center">
                        <img src={URL.createObjectURL(taskImage)} alt="Preview" className="w-32 h-32 object-contain rounded-md" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="bg-p text-white px-4 py-2 rounded hover:bg-p/90"
                      onClick={async () => {
                        if (!selectedServiceId || !taskTitle || !taskDesc || !taskDuration || !taskCredits) {
                          toast.error("Please fill out all required fields.");
                          return;
                        }

                        try {
                          const formData = new FormData();
                          formData.append("serviceId", selectedServiceId);
                          formData.append("title", taskTitle);
                          formData.append("description", taskDesc);
                          formData.append("duration", taskDuration);
                          formData.append("timeCredits", taskCredits);
                          if (taskImage) formData.append("image", taskImage);

                          await axios.post(`${apiUrl}/api/user/services/${selectedServiceId}`, formData, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "multipart/form-data",
                            },
                          });

                          toast.success("Task posted successfully!");
                          setShowTaskModal(false);
                          setSelectedServiceId('');
                          setTaskTitle('');
                          setTaskDesc('');
                          setTaskDuration('');
                          setTaskCredits('');
                          setTaskImage(null);
                        } catch (error) {
                          console.error("Error posting task:", error);
                          toast.error("Failed to post task");
                        }
                      }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  )
}

export default Explore