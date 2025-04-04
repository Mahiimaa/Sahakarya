import React, { useState, useEffect } from "react";
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminServiceRequests = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/admin/service-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setServiceRequests(response.data.data.serviceRequests);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching service requests:", err);
      setError("Failed to load service requests");
      setLoading(false);
      toast.error("Error loading service requests");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-p" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading service requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={fetchServiceRequests}
            className="mt-2 bg-p hover:bg-p/90 text-white rounded py-2 px-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
    <div className="bg-screen p-4  border-none rounded-2xl">
      <h1 className=" text-h1 font-semi-bold mb-6">Service Requests</h1>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-h2 font-semi-bold">User Requested Services</h2>
          <div className="text-h3 text-p">
            {serviceRequests.length} {serviceRequests.length === 1 ? "request" : "requests"}
          </div>
        </div>
        
        {serviceRequests.length === 0 ? (
          <div className="p-6 text-center text-s">
            No service requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-grey/50">
                <tr>
                  <th className="py-3 px-4 text-left text-h3 font-semi-bold ">Service Name</th>
                  <th className="py-3 px-4 text-left text-h3 font-semi-bold ">Description</th>
                  <th className="py-3 px-4 text-left text-h3 font-semi-bold ">Requested By</th>
                  <th className="py-3 px-4 text-left text-h3 font-semi-bold ">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {serviceRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{request.serviceName}</td>
                    <td className="py-3 px-4">
                      {request.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                    <td className="py-3 px-4">
                      {request.requestedBy ? (
                        <div>
                          <div>{request.requestedBy.username}</div>
                          <div className="text-gray-500 text-h3">{request.requestedBy.email}</div>
                        </div>
                      ) : (
                        "Unknown User"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(request.createdAt).toLocaleDateString()} 
                      <div className="text-gray-500 text-h3">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-6 p-4 rounded-lg text-p text-center">
        <p className="font-medium">Remember:</p>
        <p className="mt-1">If you find a requested service relevant, you can add it through the regular "Add Service" form.</p>
      </div>
      <ToastContainer pauseOnHover theme="light" />
      </div>
    </div>
    </div>
  );
};

export default AdminServiceRequests;