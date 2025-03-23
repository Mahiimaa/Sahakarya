import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Mediation = ({ booking, currentUser }) => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [mediationMessages, setMediationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking.status === "in mediation") {
      fetchMediationMessages();
    }
  }, [booking]);

  const fetchMediationMessages = async () => {
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
      await axios.post(
        `${apiUrl}/api/bookings/${booking._id}/mediation-messages`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      toast.success("Message sent");
      fetchMediationMessages();
    } catch (error) {
      toast.error("Error sending message");
    }
  };

  if (booking.status !== "in mediation") {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-light-grey/50 rounded-lg border border-p/30">
      <h3 className="text-h3 font-semibold mb-2">Mediation Status</h3>
      <p className="mb-4">
        Your dispute is currently under mediation. A neutral third party will review the case and make a final decision.
      </p>

      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-h4 font-semibold">Communication</h4>
          <button
            className="text-p text-sm hover:underline"
            onClick={fetchMediationMessages}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto mb-3 p-2 bg-light-grey/30 rounded">
          {mediationMessages.length > 0 ? (
            mediationMessages.map((msg) => (
              <div
                key={msg._id}
                className={`p-2 mb-2 rounded ${
                  msg.isFromMediator
                    ? "bg-s/20 border-l-4 border-s"
                    : msg.sender === currentUser._id
                    ? "bg-p/10 ml-auto max-w-[85%]"
                    : "bg-light-grey max-w-[85%]"
                }`}
              >
                <div className="text-xs text-dark-grey mb-1 font-medium">
                  {msg.isFromMediator
                    ? "Mediator"
                    : msg.sender === currentUser._id
                    ? "You"
                    : msg.senderName}{" "}
                  • {new Date(msg.timestamp).toLocaleString()}
                </div>
                <div className="text-sm">{msg.message}</div>
              </div>
            ))
          ) : (
            <p className="text-grey italic text-center py-4">
              No messages yet. Start the conversation to resolve your dispute.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message here..."
            className="flex-1 p-2 border rounded"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mediation;