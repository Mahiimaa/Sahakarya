import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {toast} from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";

function ServiceDetails() {
  const { _id } = useParams();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);


  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, [apiUrl]);

  useEffect(() => {
    console.log("Service ID:", _id);
    const fetchServiceDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/services/${_id}`,{
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        setService(data.service);
        setProviders(data.providers);
      } catch (error) {
        console.error("Error fetching service details:", error);
      }
    };
    fetchServiceDetails();
  }, [_id, apiUrl]);

  return (
    <div className= "flex flex-col">
      <Navbar />
      <div className="flex mx-28 ">
        <button className="flex hover:text-p items-start rounded p-2 h-fit">
          <NavLink to="/explore" className="flex items-center">
            <svg
              className="w-7 h-7 mr-2"
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
          </NavLink>
        </button>
     
      <div className="">
        {service && (
          <h1 className="text-h1 font-bold">{service.serviceName}</h1>
        )}
        <h2 className="text-h3 font-body mt-4">Available Providers</h2>
        <div className="grid grid-cols-5 gap-4 mt-4">
          {providers.length > 0 ? (
            providers.filter(provider => currentUser?._id !== provider._id && provider.serviceDetail && provider.serviceDetail.description) .map((provider) => (
              <div key={provider._id} className="p-4 border border-dark-grey rounded-lg bg-white shadow-md hover:shadow-xl transition-all duration-200 w-full max-w-sm hover:-translate-y-1.5 flex flex-col h-full"
              >
                {provider.serviceDetail ? (
                <div className="p-2 " onClick={() => navigate(`/provider-details/${provider._id}?serviceId=${service._id}`)}>
                   {provider.serviceDetail.image && (
                      <img src={provider.serviceDetail.image.startsWith("http") ? provider.serviceDetail.image : `${apiUrl}${provider.serviceDetail.image}`}  alt="Service" className="w-full h-48 object-cover rounded-md" />
                      
                    )}
                   
                    <div className="flex items-center gap-4 py-2">
                  {provider.profilePicture && (
                    <img src={`${apiUrl}${provider.profilePicture}`} alt="Profile" className="w-8 h-8 rounded-full" />
                  )}
                <h3 className="font-bold">{provider.username}</h3>
                </div>
                {/* <p className="text-small text-grey">{provider.email}</p> */}
               
                <h4 className="font-semi-bold text-h3">{provider.serviceDetail.title}</h4>
                    <p className="text-h3 line-clamp-2 hover:underline" >{provider.serviceDetail.description}</p>
                    <div className="flex-grow"></div>
                    <div className=" flex justify-between mt-2">
                            <span className="font-semi-bold text-h3">{provider.serviceDetail.duration || "N/A"} hours</span>
                     
                           <span className="font-semi-bold text-h3">{provider.serviceDetail.timeCredits || "N/A"} credits</span>
                        </div>
                  </div>
                  
                ) : (
                  <p className="text-sm text-gray-500">No additional details provided.</p>
                )}
                <button
                  className="mt-4  text-p p-2 border border-p rounded-lg w-full hover:bg-p hover:text-white"
                  onClick={async () => {
                    try {
                      await axios.post(`${apiUrl}/api/bookings`, { serviceId: service._id, providerId: provider._id }, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
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
            <p className="text-light-grey">No providers available for this service.</p>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export default ServiceDetails;
