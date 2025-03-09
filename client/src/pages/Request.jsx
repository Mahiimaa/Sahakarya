import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import ScheduleModal from "../components/Schedule";

const Request = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [bookings, setBookings] = useState([]);
  const [outgoingBookings, setOutgoingBookings] = useState([]);
  const [error, setError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("incoming");

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBookingId, setTransferBookingId] = useState(null);
  const [transferProviderId, setTransferProviderId] = useState(null);
  const [transferAmount, setTransferAmount] = useState(""); 
  const [transferPassword, setTransferPassword] = useState("");

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
    }, [apiUrl, token]);
    
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

  const handleOpenScheduleModal = (bookingId) => {
    setCurrentBookingId(bookingId);
    setShowScheduleModal(true);
  };

  const acceptBooking = async (scheduleDate, serviceDuration) => {
    if (!currentBookingId){
      toast.error("Invalid schedule details.");
      return;
    }
    try {
      await axios.put(`${apiUrl}/api/${currentBookingId}/accept`, { scheduleDate, serviceDuration }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service request accepted!");
      setBookings((prev) =>
        prev.map((b) =>
          b._id === currentBookingId
            ? { ...b, status: "scheduled", scheduleDate, serviceDuration }
            : b
        ));
      setShowScheduleModal(false);
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

  const confirmCompletion = async (bookingId) => {
    try {
      const {data} =await axios.put(`${apiUrl}/api/${bookingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service confirmation successful!");
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === bookingId
            ? { ...b, status: data.status, confirmedByRequester: data.confirmedByRequester, confirmedByProvider: data.confirmedByProvider }
            : b
        ));
    } catch (error) {
      toast.error("Error confirming service completion.");
    }
  };

  const handleOpenTransferModal = (bookingId, providerId, serviceDuration) => {
    setTransferBookingId(bookingId);
    setTransferProviderId(providerId);
    setTransferAmount(serviceDuration);
    setShowTransferModal(true);
  };

  const transferTimeCredits = async () => {
    if (!transferAmount || !transferPassword) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      await axios.put(`${apiUrl}/api/bookings/${transferBookingId}/transfer-credits`, 
        { providerId: transferProviderId, amount: transferAmount, password: transferPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Time credits transferred successfully!");
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === transferBookingId ? { ...b, status: "credit transferred" } : b
        )
      );
      setShowTransferModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error transferring time credits.");
    }
  };

  

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className=" flex flex-col justify-between gap-6 shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
      <div className="flex gap-4 justify-center items-center mb-6">
          <button
            className={`px-4 py-2 rounded-md text-lg font-semibold ${
              activeTab === "incoming" ? "bg-p text-white" : "bg-light-grey text-grey"
            }`}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming Requests
          </button>
          <button
            className={`px-4 py-2 rounded-md text-lg font-semibold ${
              activeTab === "outgoing" ? "bg-p text-white" : "bg-light-grey text-grey"
            }`}
            onClick={() => setActiveTab("outgoing")}
          >
            My Requests
          </button>
        </div>
        {activeTab === "incoming" && (
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
        : booking.status === "scheduled"
        ? "text-p" 
        : booking.status === "completed"
        ? "text-p" 
        : booking.status === "rejected"
        ? "text-error"  
        : "text-grey" 
    }`}
  >
    {booking.status}
  </span></p>
              <p><strong>Requested on:</strong> {new Date(booking.dateRequested).toLocaleString()}</p>

                <div className="mt-4 flex gap-2">
                {booking.status === "pending" && (
                  <>
                  <button
                    className="bg-p text-white px-4 py-2 rounded whitespace-nowrap"
                    onClick={() => handleOpenScheduleModal(booking._id)}
                  >
                    Accept & Schedule
                  </button>
                  <button
                    className="bg-error text-white px-4 py-2 rounded"
                    onClick={() => rejectBooking(booking._id)}
                  >
                    Reject
                  </button>
                  </>
                  )} 
                  <div className="flex w-full justify-end">
                  {booking.status === "scheduled" && booking.scheduleDate && !isNaN(new Date(booking.scheduleDate)) && (
                      <button
                        className={`bg-p text-white px-4 py-2 rounded  ${
                          booking.confirmedByRequester && booking.confirmedByProvider ? "bg-p" : "bg-p"
                        }`}
                        onClick={() => confirmCompletion(booking._id)}
                      >
                        {booking.confirmedByRequester && booking.confirmedByProvider
                     ? "Service Completed"
                     : booking.confirmedByRequester
                     ? "Confirmed by Requester"
                     : booking.confirmedByProvider
                     ? "Confirmed by You"
                     : "Confirm Completion"}
                      </button>
                    )}
                    
                  <button
                    className="bg-white text-p border border-p hover:bg-p hover:text-white px-4 py-2 rounded ml-4"
                    onClick={() => openChat(booking.provider, booking.requester)}
                  >
                    Chat
                  </button>
                  </div>
                </div>
               </div>
          ))
        ) : (
          <p className="text-s">No pending service requests.</p>
        )}
        </div>
        )}
        {activeTab === "outgoing" && (
        <div className="flex flex-col w-full">
        <h1 className="text-h2 font-semi-bold mb-4">My Service Requests</h1>
        {outgoingBookings.length > 0 ? (
          outgoingBookings.map(booking => (
            <div key={booking._id} className="p-4 border border-dark-grey rounded-lg shadow-md bg-white mb-4">
              <h2 className="text-h2  pb-2">Request Sent for {booking?.service?.serviceName}</h2>
              <p><strong>Provider:</strong> {booking?.provider?.username}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-md font-semi-bold 
                ${booking.status === "pending" ? "text-s" : 
                booking.status === "scheduled" ? "text-p" : 
                booking.status === "completed" ? "text-p" :
                "text-error"}`}>
                {booking.status}
              </span></p>
              <p><strong>Requested on:</strong> {new Date(booking.dateRequested).toLocaleString()}</p>
              {booking.status === "scheduled" && (
              <div className="">
          <p><strong>Scheduled for:</strong> {new Date(booking.scheduleDate).toLocaleString()}</p>
          <p><strong>Duration:</strong> {booking.serviceDuration} hour(s)</p>
        </div>
      )}
          <div className="flex mt-4 justify-end">
          {booking.status === "scheduled" && booking.scheduleDate && !isNaN(new Date(booking.scheduleDate)) && (
        <button
          className={`bg-p text-white px-4 py-2 rounded ${
            booking.confirmedByRequester && booking.confirmedByProvider ? "bg-p" : "bg-p"
          }`}
          onClick={() => confirmCompletion(booking._id)}
        >
          {booking.status === "credit transferred"
            ? "Credit Transferred"
            :booking.confirmedByRequester && booking.confirmedByProvider
           ? "Service Completed"
           : booking.confirmedByRequester
           ? "Confirmed by Requester"
           : booking.confirmedByProvider
           ? "Confirmed by Provider"
           : "Confirm Completion"}
        </button>
      )}
      {booking.confirmedByRequester && booking.confirmedByProvider && currentUser && currentUser._id === booking.requester._id && booking.status !== "credit transferred" && (
                      <button
                        className="bg-p text-white px-4 py-2 rounded ml-4"
                        onClick={() => handleOpenTransferModal(booking._id, booking.provider._id, booking.serviceDuration)}
                      >
                        Transfer Time Credits
                      </button>
                    )}
      <button className="bg-white text-p border border-p hover:bg-p hover:text-white px-4 py-2 rounded ml-4 " onClick={() => openChat(booking.requester, booking.provider)}>Chat</button>
      </div>
            </div>
          ))
        ) : (
          <p className="text-s">No outgoing service requests.</p>
        )}
      </div>
        )}
      {isChatOpen && selectedProvider && selectedRequester && (
                <Chat provider={selectedProvider}  requester={selectedRequester} onClose={closeChat} />
                )}
                <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={acceptBooking}
      />
    </div>
    {showTransferModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h2 className="text-h2 font-bold mb-4">Transfer Time Credits</h2>
            <label className="font-semi-bold text-h3"> Time credits</label>
            <input type="number" placeholder="Enter Time Credits" className="w-full p-2 border rounded mb-2"
              value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
            />
            <label className="font-semi-bold text-h3">Password</label>
            <input type="password" placeholder="Enter Password" className="w-full p-2 border rounded mb-2"
              value={transferPassword} onChange={(e) => setTransferPassword(e.target.value)}
            />
            <div className="flex justify-between mt-4">
              <button className="bg-white border text-error border-error hover:bg-error hover:text-white px-4 py-2 rounded" onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button className="bg-p text-white px-4 py-2 rounded" onClick={transferTimeCredits}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Request;
