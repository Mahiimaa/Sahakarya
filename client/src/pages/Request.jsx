import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import ScheduleModal from "../components/Schedule";
import ReactStars from "react-rating-stars-component";

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [actualDuration, setActualDuration] = useState("");
  const [proposedCredits, setProposedCredits] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewProviderId, setReviewProviderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

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
        const sortedIncoming = requestReceived.data.sort((a, b) => 
          new Date(b.dateRequested) - new Date(a.dateRequested)
        );
        setBookings(sortedIncoming);

        const requestMade = await axios.get(`${apiUrl}/api/bookings/requester`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedOutgoing = requestMade.data.sort((a, b) => 
          new Date(b.dateRequested) - new Date(a.dateRequested)
        );
        setOutgoingBookings(sortedOutgoing);
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
        ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested)));
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

  const initiateCompletion = (bookingId) => {
    setCurrentBookingId(bookingId);
    setShowCompletionModal(true);
  };
  
  const submitProviderCompletion = async () => {
    if (!actualDuration || !proposedCredits) {
      toast.error("Please fill all required fields.");
      return;
    }
    
    try {
      const { data } = await axios.put(
        `${apiUrl}/api/bookings/${currentBookingId}/provider-completion`, 
        { 
          actualDuration, 
          proposedCredits,
          completionNotes 
        }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success("Service completion details submitted!");
      setShowCompletionModal(false);
      
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === currentBookingId
            ? { ...b, 
                status: "awaiting requester confirmation", 
                confirmedByProvider: true,
                actualDuration,
                proposedCredits,
                completionNotes
              }
            : b
        ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Error submitting completion details.");
    }
  };

  const disputeCompletion = () => {
    setShowDisputeModal(true);
  };
  
  const submitDispute = async () => {
    if (!disputeReason) {
      toast.error("Please provide a reason for the dispute.");
      return;
    }
    
    try {
      const { data } = await axios.put(
        `${apiUrl}/api/bookings/${currentBookingId}/dispute`, 
        { disputeReason }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success("Dispute submitted!");
      setShowDisputeModal(false);
      
      setOutgoingBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === currentBookingId
            ? { ...b, status: "disputed", disputeReason }
            : b
        ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
      );
    } catch (error) {
      toast.error("Error submitting dispute.");
    }
  };

  const confirmCompletion = async (bookingId) => {
    setCurrentBookingId(bookingId);
    try {
      const {data} =await axios.put(`${apiUrl}/api/${bookingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service confirmation successful!");
      // setBookings((prevBookings) =>
      //   prevBookings.map((b) =>
      //     b._id === bookingId
      //       ? { ...b, status: data.status, confirmedByRequester: data.confirmedByRequester, confirmedByProvider: data.confirmedByProvider }
      //       : b
      //     ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested)));

          setOutgoingBookings((prevBookings) =>
            prevBookings.map((b) =>
              b._id === bookingId
                ? { ...b, 
                  status: data.status, 
                  confirmedByRequester: data.confirmedByRequester, 
                  confirmedByProvider: data.confirmedByProvider,
                  creditTransferred: data.creditTransferred }
                : b
            ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
          );
    } catch (error) {
      toast.error("Error confirming service completion.");
    }
  };

  const handleOpenReviewModal = (bookingId, providerId) => {
    setReviewBookingId(bookingId);
    setReviewProviderId(providerId);
    setShowReviewModal(true);
  };
  
  const submitReview = async () => {
    try {
      await axios.post(
        `${apiUrl}/api/reviews`, 
        {
          bookingId: reviewBookingId,
          providerId: reviewProviderId,
          rating,
          comment: reviewText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
      setOutgoingBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === reviewBookingId ? { ...b, reviewed: true } : b
        ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
      );
      setRating(5);
      setReviewText("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error submitting review.");
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
                    className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded whitespace-nowrap"
                    onClick={() => handleOpenScheduleModal(booking._id)}
                  >
                    Accept & Schedule
                  </button>
                  <button
                    className="bg-error hover:bg-error/90 text-white px-4 py-2 rounded"
                    onClick={() => rejectBooking(booking._id)}
                  >
                    Reject
                  </button>
                  </>
                  )} 
                  <div className="flex w-full justify-end">
                  {booking.status === "scheduled" && booking.scheduleDate && !isNaN(new Date(booking.scheduleDate)) && (
                      <button
                        className ="bg-p hover:bg-p/90 text-white px-4 py-2 rounded" 
                        onClick={() => initiateCompletion(booking._id)}
                      >
                        {booking.confirmedByRequester && booking.confirmedByProvider
                     ? "Service Completed"
                     : booking.confirmedByProvider
                      ? "Completion Details Submitted"
                      : "Submit Completion Details"}
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
                booking.status === "credit transferred" ? "text-p" :
                booking.status === "awaiting requester confirmation" ? "text-s" :
                booking.status === "disputed" ? "text-error" :
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
          {booking.actualDuration && booking.proposedCredits && (
        <div className="mt-2 p-2 bg-s/20 rounded-md">
          <p><strong>Actual Duration:</strong> {booking.actualDuration} hour(s)</p>
          <p><strong>Proposed Time Credits:</strong> {booking.proposedCredits}</p>
          {booking.completionNotes && (
            <p><strong>Notes:</strong> {booking.completionNotes}</p>
          )}
          <p className="text-s mt-2">
          <strong>Note:</strong> Confirming will automatically transfer {booking.proposedCredits} time credits to the provider.
        </p>
        </div>
      )}
      
      <div className="flex mt-4 justify-end">
        {booking.status === "awaiting requester confirmation" && (
          <>
            <button
              className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
              onClick={() => confirmCompletion(booking._id)}
            >
              Confirm & Transfer Credits
            </button>
            <button
              className="bg-white text-error border border-error hover:bg-error hover:text-white px-4 py-2 rounded ml-2"
              onClick={() => {
                setCurrentBookingId(booking._id);
                disputeCompletion();
              }}
            >
              Dispute
            </button>
          </>
        )}
        
        {booking.status === "completed" && !booking.reviewed && (
          <button
            className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded ml-2"
            onClick={() => handleOpenReviewModal(booking._id, booking.provider._id)}
          >
            Leave Review
          </button>
        )}
        {booking.reviewed && (
          <span className="text-p font-medium ml-2 self-center">Review Submitted</span>
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
    {showCompletionModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-h2 font-bold mb-4">Service Completion Details</h2>
          
          <label className="font-semi-bold text-h3">Actual Service Duration (hours)</label>
          <input 
            type="number" 
            placeholder="Hours spent on service" 
            className="w-full p-2 border rounded mb-2"
            value={actualDuration} 
            onChange={(e) => setActualDuration(e.target.value)}
          />
          
          <label className="font-semi-bold text-h3">Proposed Time Credits</label>
          <input 
            type="number" 
            placeholder="Credits to transfer" 
            className="w-full p-2 border rounded mb-2"
            value={proposedCredits} 
            onChange={(e) => setProposedCredits(e.target.value)}
          />
          
          <label className="font-semi-bold text-h3">Notes (Optional)</label>
          <textarea
            placeholder="Any notes about the service completion"
            className="w-full p-2 border rounded mb-2"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
          
          <div className="flex justify-between mt-4">
            <button 
              className="bg-white border text-error border-error hover:bg-error hover:text-white px-4 py-2 rounded" 
              onClick={() => setShowCompletionModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded" 
              onClick={submitProviderCompletion}
            >
              Submit Details
            </button>
          </div>
        </div>
      </div>
    )}
    {showDisputeModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-h2 font-bold mb-4">Dispute Service Completion</h2>
          
          <label className="font-semi-bold text-h3">Reason for Dispute</label>
          <textarea
            placeholder="Please explain why you're disputing this completion"
            className="w-full p-2 border rounded mb-2"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          
          <div className="flex justify-between mt-4">
            <button 
              className="bg-white border text-error border-error hover:bg-error hover:text-white px-4 py-2 rounded" 
              onClick={() => setShowDisputeModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded" 
              onClick={submitDispute}
            >
              Submit Dispute
            </button>
          </div>
        </div>
      </div>
    )}

    {showReviewModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-h2 font-bold mb-4">Rate Your Experience</h2>
          
          <div className="mb-4">
            <label className="font-semi-bold text-h3">Rating</label>
            <div className="flex items-center gap-2 my-2">
                <ReactStars
                  count={5}
                  onChange={setRating}
                  size={36}
                  value={rating}
                  activeColor="#ffd700"
                />
              </div>
          </div>
          
          <label className="font-semi-bold text-h3">Review</label>
          <textarea
            placeholder="Share your experience with this service"
            className="w-full p-2 border rounded mb-2"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          
          <div className="flex justify-between mt-4">
            <button 
              className="bg-white border text-error border-error hover:bg-error hover:text-white px-4 py-2 rounded" 
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded" 
              onClick={submitReview}
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Request;
