import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Chat from "../components/Chat";
import Navbar from "../components/Navbar";

function ServiceDetails() {
  const { _id } = useParams();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

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
    <div>
      <Navbar />
      <div className="p-6 mx-auto max-w-4xl">
        {service && (
          <h1 className="text-2xl font-bold">{service.serviceName}</h1>
        )}
        <h2 className="text-xl font-semibold mt-4">Available Providers</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <div key={provider._id} className="p-4 border rounded-lg bg-white shadow">
                <h3 className="font-bold">{provider.name}</h3>
                <p>{provider.email}</p>
                <button
                  className="mt-2 bg-p text-white p-2 rounded-lg w-full"
                  onClick={() => {
                    setChatOpen(true);
                    setSelectedProvider(provider);
                  }}
                >
                  Chat with {provider.name}
                </button>
              </div>
            ))
          ) : (
            <p>No providers available for this service.</p>
          )}
        </div>
      </div>
      {chatOpen && selectedProvider && (
        <Chat provider={selectedProvider} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

export default ServiceDetails;
