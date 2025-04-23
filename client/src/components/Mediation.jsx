import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Mediation = ({ booking, currentUser }) => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [mediationMessages, setMediationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(false);

  useEffect(() => {
    if (booking && (booking.status === "in mediation" || booking.status === "mediation resolved")) {
      fetchMediationMessages();
    }
  }, [booking]);

  const fetchMediationMessages = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/bookings/${booking._id}/mediation-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMediationMessages(data);
    } catch (error) {
      console.error("Error fetching mediation messages:", error);
      toast.error("Could not load mediation messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data } = await axios.post(
        `${apiUrl}/api/bookings/${booking._id}/mediation-messages`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data && data._id) {
        setMediationMessages(prev => [...prev, data]);
      } else {
        fetchMediationMessages();
      }
      setNewMessage("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Error sending message");
    }finally {
      setSendingMessage(false);
    }
  };

  if (!booking || (booking.status !== "in mediation" && booking.status !== "mediation resolved")) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isResolved = booking.status === "mediation resolved";
  const resolutionMessage = mediationMessages.find(msg => msg.isResolution);
  const resolutionDate = booking.mediationResolvedAt || 
    (resolutionMessage ? resolutionMessage.timestamp : null);

  return (
    <div className={`mt-4 p-4 rounded-lg border font-poppins ${
      isResolved ? "bg-p/10 border-p" : "bg-light-grey/50 border-p/30"
    }`}>
      <h3 className={`text-h3 font-semi-bold mb-2 ${isResolved ? "text-p bg-p/20 p-2 rounded-md w-fit " : ""}`}>
        {isResolved ? "Mediation Resolved" : "Mediation In Progress"}
      </h3>
      
      {isResolved ? (
        <div className="mb-4">
          <p className="mb-2 text-s">
            This dispute has been resolved by a mediator. The final decision is shown below.
          </p>
          <div className="bg-white p-3 rounded-md border border-p mb-3">
            <h4 className="font-semi-bold text-p mb-1">Mediator Decision</h4>
            <p className="whitespace-pre-line mb-2">{booking.mediationDecision}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-small mt-3">
              <p><span className="font-semi-bold">Final Credits:</span> {booking.finaltimeCredits}</p>
              <p><span className="font-semi-bold">Resolved On:</span> {resolutionDate ? formatDate(resolutionDate) : "Unknown"}</p>
              <p><span className="font-semi-bold">Credits Transferred:</span> {booking.creditTransferred ? "Yes" : "Pending"}</p>
            </div>
          </div>
        </div>
      ) : (
      <p className="mb-4 text-s">
        Your dispute is currently under mediation. A neutral third party will review the case and make a final decision.
      </p>
      )}
      
        <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
          <h4 className="text-h4 font-semi-bold">Communication</h4>
          <div className="flex gap-2 ml-auto">
          <button
            className="text-p text-small hover:underline"
            onClick={() => setExpandedMessages(!expandedMessages)}
          >
            {expandedMessages ? "Collapse" : "Expand"}
          </button>
          <button
            className="text-p text-small hover:underline"
            onClick={() => setExpandedMessages(!expandedMessages)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        </div>
        <div className="px-2 sm:px-0">
        <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className={`${expandedMessages ? "max-h-96" : "max-h-60"} overflow-y-auto mb-3 p-2 bg-light-grey/30 rounded transition-all duration-300`}>
          {mediationMessages.length > 0 ? (
            mediationMessages.map((msg) => {
              const isCurrentUser = msg.sender === currentUser._id;
              const isMediator = msg.isFromMediator;
              const isResolutionMessage = msg.isResolution;
              return (
              <div
                key={msg._id}
                className={`p-2 mb-2 rounded break-words whitespace-pre-wrap w-full sm:max-w-[65%] ${
                   isResolutionMessage
                      ? "bg-p/20 border border-p/50"
                  : isMediator
                    ? "bg-s/20 border-l-4 border-s ml-auto"
                    : isCurrentUser
                    ? "bg-p/60 ml-auto "
                    : "bg-p/20 "
                }`}
              >
                <div className="text-small text-grey mb-1 ">
                  {isMediator
                    ? "Mediator"
                    : isCurrentUser
                    ? "You"
                    : msg.senderName}{" "}
                  • {new Date(msg.timestamp).toLocaleString()}
                </div>
                <div className="text-small">{msg.message}</div>
              </div>
              );
              })
          ) : (
            <p className="text-grey italic text-center py-4">
              No messages yet. {!isResolved ? "Start the conversation to resolve your dispute." : ""}
            </p>
          )}
        </div>
        {!isResolved && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Type your message here..."
            className="w-full sm:flex-1 p-2 border rounded"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            disabled={sendingMessage}
          />
          <button
            className={`bg-p hover:bg-p/90 text-white px-4 py-2 rounded w-full sm:w-auto ${
              sendingMessage ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={sendMessage}
            disabled={sendingMessage}
          >
            {sendingMessage ? "Sending..." : "Send"}
          </button>
        </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Mediation;