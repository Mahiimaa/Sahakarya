import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Chat from "../components/Chat";

const Request = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [outgoingBookings, setOutgoingBookings] = useState([]);
  const [error, setError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

    const openChat = (requester, provider) => {
      if (!requester || !provider) {
        console.error("Error: Missing requester or provider.");
        return;
      }
      if (typeof requester === "string") {
        requester = { _id: requester };
      }
    
    console.log("Opening chat with:", { requester, provider });
    setSelectedRequester(requester);
    setSelectedProvider(provider);
    setIsChatOpen(true);
    };

    const closeChat = () => {
    setIsChatOpen(false);
    setSelectedProvider(null);
    setSelectedRequester(null);
    };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestReceived = await axios.get(`${apiUrl}/api/bookings/provider`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(requestReceived.data);

        const requestMade = await axios.get(`${apiUrl}/api/bookings/requester`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOutgoingBookings(requestMade.data);
      } catch (err) {
        console.error("Error fetching service requests:", err);
        setError("Failed to load requests.");
      } 
    };

    fetchRequests();
  }, [apiUrl, token]);

  const acceptBooking = async (bookingId) => {
    try {
      await axios.put(`${apiUrl}/api/${bookingId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service request accepted!");
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: "accepted" } : b));
    } catch (error) {
      toast.error("Error accepting request.");
    }
  };

  const rejectBooking = async (bookingId) => {
    try {
      await axios.put(`${apiUrl}/api/${bookingId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service request rejected.");
      setBookings(bookings.filter(b => b._id !== bookingId));
    } catch (error) {
      toast.error("Error rejecting request.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-28 flex justify-between gap-6">
        <div className="flex flex-col w-full">
        <h1 className="text-h2 font-semi-bold mb-4">Incoming Service Requests</h1>
        <div className="text-center text-error">{error}</div>
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <div key={booking._id} className="p-4 border border-dark-grey rounded-lg shadow-md bg-white mb-4">
              <h2 className="text-h2  pb-2">Request For {booking?.service?.serviceName}</h2>
              <p><strong>Requester:</strong> {booking?.requester?.username}</p>
              <p><strong>Status:</strong> <span
            className={`px-2 py-1 rounded-md font-semibold ${
        booking.status === "pending"
        ? "text-s " 
        : booking.status === "accepted"
        ? "text-p" 
        : booking.status === "rejected"
        ? "text-error"  
        : "text-grey" 
    }`}
  >
    {booking.status}
  </span></p>
              <p><strong>Requested on:</strong> {new Date(booking.dateRequested).toLocaleString()}</p>

              {booking.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    className="bg-p text-white px-4 py-2 rounded"
                    onClick={() => acceptBooking(booking._id)}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-error text-white px-4 py-2 rounded"
                    onClick={() => rejectBooking(booking._id)}
                  >
                    Reject
                  </button>
                  <button
                    className="bg-white text-p border border-p hover:bg-p hover:text-white px-4 py-2 rounded"
                    onClick={() => openChat(booking.provider, booking.requester)}
                  >
                    Chat
                  </button>
                  
                </div>
              )}
              
               </div>
          ))
        ) : (
          <p>No pending service requests.</p>
        )}
        </div>
        <div className="flex flex-col w-full">
        <h1 className="text-h2 font-semi-bold mb-4">My Service Requests</h1>
        {outgoingBookings.length > 0 ? (
          outgoingBookings.map(booking => (
            <div key={booking._id} className="p-4 border border-dark-grey rounded-lg shadow-md bg-white mb-4">
              <h2 className="text-h2  pb-2">Request Sent for {booking?.service?.serviceName}</h2>
              <p><strong>Provider:</strong> {booking?.provider?.username}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-md font-semibold ${booking.status === "pending" ? "text-s" : booking.status === "accepted" ? "text-p" : "text-error"}`}>
                {booking.status}
              </span></p>
              <p><strong>Requested on:</strong> {new Date(booking.dateRequested).toLocaleString()}</p>

              <button className="bg-white text-p border border-p hover:bg-p hover:text-white px-4 py-2 rounded mt-2" onClick={() => openChat(booking.requester, booking.provider)}>Chat</button>
            </div>
          ))
        ) : (
          <p>No outgoing service requests.</p>
        )}
      </div>
      {isChatOpen && selectedProvider && selectedRequester && (
                <Chat provider={selectedProvider}  requester={selectedRequester} onClose={closeChat} />
                )}
    </div>
    </div>
  );
};

export default Request;
