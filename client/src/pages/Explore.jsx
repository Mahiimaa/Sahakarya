import React, {useEffect, useState} from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom";
import axios from "axios"
import {toast} from "react-toastify";

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

  return (
    <div className = "flex flex-col">
        <Navbar />
        <div className="flex p-4 mx-28">
        <div className="w-1/6 p-4 bg-light-grey rounded-lg">
          <h2 className="text-lg font-semi-bold mb-4">Categories</h2>
          {categories.map(category => (
            <button
              key={category}
              className={`flex w-full p-2 my-1 text-left rounded-lg ${
                selectedCategory === category ? 'bg-p text-white' : 'bg-white'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="w-full px-4">
          <div className="flex justify-between mb-4">
            <input 
              type="text" 
              placeholder="Search services..." 
              className="p-2 w-full border rounded-lg"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <h2 className="text-h2 font-semi-bold mb-2">Featured Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <div key={service._id} className="p-4 border border-dark-grey rounded-lg shadow-lg bg-white hover:-translate-y-1.5 flex flex-col h-full" onClick={() => navigate(`/services/${service._id}`)}>
                  <h3 className="font-bold text-lg">{service.serviceName}</h3>
                  <p className="text-dark-grey">{service.category.categoryName}</p>
                </div>
              ))
            ) : (
              <p className="text-dark-grey">No services found.</p>
            )}
          </div>
          <h2 className="text-h2 font-semi-bold mt-8 mb-2">All Services</h2>
            <div className="grid grid-cols-3 gap-6">
              {allServiceDetails.length > 0 ? (
                allServiceDetails.map(service => (
                  <div 
                    key={service.serviceId || service._id} 
                    className="p-4 border border-dark-grey rounded-lg shadow-lg bg-white hover:-translate-y-1.5 flex flex-col h-full "
                    onClick={() => {
                      if (service.providers && service.providers.length > 0) {
                        navigate(`/provider-details/${service.providers[0]._id}?serviceId=${service.serviceId || service._id}`);
                      } else {
                        console.error("No provider available for this service.");
                        toast.error("No provider available for this service.");
                      }
                    }}
                  >
                    {service.image && (
                      <img
                        src={service.image.startsWith("http") ? service.image : `${apiUrl}${service.image}`}
                        alt="Service"
                        className="w-full h-40 object-cover rounded-md mb-3"
                        
                      />
                    )}

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
                    <p className="text-h3 line-clamp-2 hover:underline" >{service.description}</p>
                    <div className="flex justify-between items-center mt-auto">
                   <span className="font-semi-bold text-h3 ">{service.duration || "N/A"} hours</span>
                   <span className="font-semi-bold text-h3">{service.timeCredits || "N/A"} credits</span>
                   </div>
                    <button
                      className="mt-4 bg-p text-white p-2 rounded-lg w-full hover:bg-opacity-90"
                      onClick={async () => {
                        e.stopPropagation();
                        try {
                          console.log("Sending request for:", {
                            serviceId: service.serviceId || service._id,
                            providerId: service.providers[0]?._id
                          });

                          await axios.post(
                            `${apiUrl}/api/bookings`,
                            { serviceId: service.serviceId || service._id, providerId: service.providers[0]?._id },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          toast.success("Service requested successfully!");
                        } catch (error) {
                          console.error(error.response?.data?.error || "Error requesting service");
                          toast.error(error.response?.data?.error || "Error requesting service");
                        }
                      }}
                    >
                      Request Service
                    </button>

                  </div>
                ))
              ) : (
                <p className="text-dark-grey">No services found.</p>
              )}
            </div>


        </div>
      </div>
    </div>

  )
}

export default Explore