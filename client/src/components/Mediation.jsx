import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import debounce from "lodash.debounce";

const socket = io(process.env.REACT_APP_SOCKET_URL || "ws://localhost:5000", {
  transports: ["websocket", "polling"],
  autoConnect: false,
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
const Mediation = ({ booking, currentUser }) => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [mediationMessages, setMediationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMediationMessages = useCallback(
    debounce(async () => {
      if (loading || !booking?._id) return;
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/bookings/${booking._id}/mediation-messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMediationMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching mediation messages:", error);
        toast.error("Could not load mediation messages");
      } finally {
        setLoading(false);
      }
    }, 300),
    [booking?._id, token]
  );

  const handleIncomingMessage = useCallback(
    (msg) => {
      console.log("Received mediationMessage:", msg);
      if (msg.caseId === booking?._id) {
        setMediationMessages((prev) => {
          const messageExists = prev.some((m) => m._id === msg._id);
          if (messageExists) {
            console.log(`Duplicate message ignored: ${msg._id}`);
            return prev;
          }
          console.log(`Adding new message: ${msg._id}`);
          return [...prev, msg];
        });
        scrollToBottom();
      }
    },
    [booking?._id]
  );

  useEffect(() => {
    if (!booking?._id || !currentUser?._id) {
      console.log("Skipping joinRoom: missing booking._id or currentUser._id", {
        booking,
        currentUser,
      });
      return;
    }
    console.log(
      `Setting up Socket.IO for booking: ${booking._id}, user: ${currentUser._id}`
    );
    socket.connect();
    socket.emit("joinRoom", { roomId: booking._id, userId: currentUser._id });
    console.log(`Joined room ${booking._id} for user ${currentUser._id}`);

    fetchMediationMessages();

    socket.on("mediationMessage", handleIncomingMessage);

    return () => {
      socket.emit("leaveRoom", {
        roomId: booking._id,
        userId: currentUser._id,
      });
      socket.off("mediationMessage", handleIncomingMessage);
      if (socket.connected) socket.disconnect();
      console.log(`Left room ${booking._id} and disconnected`);
    };
  }, [booking?._id, currentUser?._id, handleIncomingMessage]);

  useEffect(() => {
    console.log("Mediation booking prop changed:", booking);
  }, [booking]);

  useEffect(() => {
    scrollToBottom();
  }, [mediationMessages]);

  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      sendingMessage ||
      !booking?._id ||
      !currentUser?._id
    )
      return;
    setSendingMessage(true);
    try {
      await axios.post(
        `${apiUrl}/api/bookings/${booking._id}/mediation-messages`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Error sending message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "h:mm a");
  };

  if (
    !booking ||
    !currentUser ||
    !["in mediation", "mediation resolved"].includes(booking.status)
  ) {
    return null;
  }

  const isResolved = booking.status === "mediation resolved";
  const resolutionDate = booking.mediationResolvedAt || null;

  return (
    <div
      className={`mt-4 p-4 rounded-lg border font-poppins ${
        isResolved ? "bg-p/10 border-p" : "bg-light-grey/50 border-p/30"
      }`}
    >
      <h3
        className={`text-h3 font-semi-bold mb-2 ${
          isResolved ? "text-p bg-p/20 p-2 rounded-md w-fit " : ""
        }`}
      >
        {isResolved ? "Mediation Resolved" : "Mediation In Progress"}
      </h3>

      {isResolved ? (
        <div className="mb-4">
          <p className="mb-2 text-s">
            This dispute has been resolved by a mediator. The final decision is
            shown below.
          </p>
          <div className="bg-white p-3 rounded-md border border-p mb-3">
            <h4 className="font-semi-bold text-p mb-1">Mediator Decision</h4>
            <p className="whitespace-pre-line mb-2">
              {booking.mediationDecision}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-small mt-3">
              <p>
                <span className="font-semi-bold">Final Credits:</span>{" "}
                {booking.finaltimeCredits}
              </p>
              <p>
                <span className="font-semi-bold">Resolved On:</span>{" "}
                {resolutionDate ? formatDate(resolutionDate) : "Unknown"}
              </p>
              <p>
                <span className="font-semi-bold">Credits Transferred:</span>{" "}
                {booking.creditTransferred ? "Yes" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-s">
          Your dispute is currently under mediation. A neutral third party will
          review the case and make a final decision.
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
            onClick={() => fetchMediationMessages()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>
      <div className="px-2 sm:px-0">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div
            className={`${
              expandedMessages ? "max-h-96" : "max-h-60"
            } overflow-y-auto mb-3 p-2 bg-light-grey/30 rounded transition-all duration-300`}
          >
            {mediationMessages.length > 0 ? (
              mediationMessages.map((msg) => {
                const isCurrentUser = msg.sender?._id
                  ? msg.sender._id.toString() === currentUser._id.toString()
                  : msg.sender.toString() === currentUser._id.toString();
                const isMediator = msg.isFromMediator;
                const isResolutionMessage =
                  isResolved &&
                  isMediator &&
                  booking.mediationDecision === msg.message;
                return (
                  <div
                    key={msg._id}
                    className={`p-2 mb-2 rounded break-words whitespace-pre-wrap w-full sm:max-w-[65%] ${
                      isResolutionMessage
                        ? "bg-p/20 border border-p/50"
                        : isMediator
                        ? "bg-s/20 border-l-4 border-s"
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
                      • {formatMessageTime(msg.timestamp)}
                    </div>
                    <div className="text-small">{msg.message}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-grey italic text-center py-4">
                No messages yet.{" "}
                {!isResolved
                  ? "Start the conversation to resolve your dispute."
                  : ""}
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
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                disabled={sendingMessage}
              />
              <button
                className={`bg-p hover:bg-p/90 text-white px-4 py-2 rounded w-full sm:w-auto flex items-center justify-center ${
                  sendingMessage || !newMessage.trim()
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mediation;
