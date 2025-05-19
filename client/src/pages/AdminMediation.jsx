import React, { useEffect, useState, useRef, useCallback} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import debounce from "lodash.debounce";

const socket = io(process.env.REACT_APP_SOCKET_URL || "ws://localhost:5000", {
  transports: ["websocket", "polling"],
  autoConnect: false,
  withCredentials: true,
});

const AdminMediation = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [activeCases, setActiveCases] = useState([]);
  const [resolvedCases, setResolvedCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [mediationMessages, setMediationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [mediationDecision, setMediationDecision] = useState("");
  const [proposedCredits, setProposedCredits] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMediationCases();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(data.id);
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
      }
    };
    fetchUserDetails();
  }, [token, apiUrl]);

  useEffect(() => {
    if (!userId || !activeCase?._id) {
      console.log("Skipping joinRoom: missing userId or activeCase._id", {
        userId,
        activeCase,
      });
      return;
    }
    console.log(
      `Setting up Socket.IO for activeCase: ${activeCase._id}, user: ${userId}`
    );
    socket.connect();
    socket.emit("joinRoom", { roomId: activeCase._id, userId });
    console.log(`Joined room ${activeCase._id} for user ${userId}`);

    const handleIncomingMessage = (msg) => {
      console.log("Received mediationMessage:", msg);
      if (msg.caseId === activeCase._id) {
        setMediationMessages((prev) => {
          const messageExists = prev.some((m) => m._id === msg._id);
          return messageExists ? prev : [...prev, msg];
        });
        scrollToBottom();
      }
    };
    socket.on("mediationMessage", handleIncomingMessage);
    return () => {
      socket.emit("leaveRoom", { roomId: activeCase._id, userId });
      socket.off("mediationMessage", handleIncomingMessage);
      if (socket.connected) socket.disconnect();
      console.log(`Left room ${activeCase._id} and disconnected`);
    };
  }, [userId, activeCase?._id]);

  useEffect(() => {
    console.log("AdminMediation activeCase state changed:", activeCase);
  }, [activeCase]);

  const fetchMediationCases = async () => {
    try {
      const { data: activeData } = await axios.get(
        `${apiUrl}/api/mediation/cases`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActiveCases(activeData);
      console.log("Active" , activeData);
      const { data: resolvedData } = await axios.get(
        `${apiUrl}/api/mediation/resolved-cases`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResolvedCases(resolvedData);
    } catch (error) {
      console.error("Error fetching mediation cases:", error);
      toast.error("Failed to load mediation cases");
    }
  };

  const fetchCaseDetails = async (caseId) => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/mediation/cases/${caseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActiveCase(data);
      fetchMediationMessages(caseId);
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast.error("Failed to load case details");
    }
  };

  const fetchMediationMessages = useCallback(
    debounce(async (caseId) => {
      if (loading) return;
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/bookings/${caseId}/mediation-messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMediationMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error("Error fetching mediation messages:", error);
        toast.error("Failed to load mediation messages");
      } finally {
        setLoading(false);
      }
    }, 300),
    [token]
  );

 const sendMediationMessage = async () => {
    if (!newMessage.trim() || !activeCase || sendingMessage) return;
    setSendingMessage(true);
    try {
      await axios.post(
        `${apiUrl}/api/bookings/${activeCase._id}/mediation-messages`,
        { message: newMessage, isFromMediator: true },
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

  const openDecisionModal = () => {
    if (activeCase) {
      setProposedCredits(activeCase.proposedCredits || "");
      setShowDecisionModal(true);
    }
  };

  const submitMediationDecision = async () => {
    if (!mediationDecision.trim() || !activeCase) {
      toast.error("Please provide a decision explanation");
      return;
    }

    try {
      await axios.post(
        `${apiUrl}/api/mediation/${activeCase._id}/resolve`,
        {
          decision: mediationDecision,
          finaltimeCredits: proposedCredits,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Mediation resolved successfully");
      setShowDecisionModal(false);

      // Refresh data
      fetchMediationCases();
      setActiveCase(null);
    } catch (error) {
      toast.error("Error resolving mediation");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "h:mm a");
  };

  return (
    <div className="flex gap-4 font-poppins">
      <Navbar />
      <div className="flex flex-col gap-4">
        <Topbar />
        <div className="bg-screen p-4  border-none rounded-2xl">
          <h1 className="text-h1 font-semi-bold mb-6">Mediation Dashboard</h1>
          <div className="flex mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "active"
                  ? "border-b-2 border-p text-p"
                  : "text-dark-grey"
              }`}
              onClick={() => setActiveTab("active")}
            >
              Active Cases ({activeCases.length})
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "resolved"
                  ? "border-b-2 border-p text-p"
                  : "text-dark-grey"
              }`}
              onClick={() => {
                setActiveTab("resolved");
                setActiveCase(null);
              }}
            >
              Resolved Cases ({resolvedCases.length})
            </button>
          </div>
          <div className="flex gap-6">
            {/* Case List */}
            <div className="w-1/3 bg-white rounded-lg shadow-md p-4 max-h-[680px] overflow-y-auto ">
              <h2 className="text-h2 font-semi-bold mb-4">
                {activeTab === "active"
                  ? "Active Mediation Cases"
                  : "Resolved Mediation Cases"}
              </h2>

              {loading ? (
                <div className="text-center py-4">Loading cases...</div>
              ) : activeTab === "active" ? (
                activeCases.length === 0 ? (
                  <p className="text-grey italic">No active mediation cases</p>
                ) : (
                  <div className="space-y-2">
                    {activeCases.map((mCase) => (
                      <div
                        key={mCase._id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          activeCase && activeCase._id === mCase._id
                            ? "border-p bg-p/10"
                            : "border-grey hover:bg-light-grey"
                        }`}
                        onClick={() => fetchCaseDetails(mCase._id)}
                      >
                        <div className="font-semi-bold">
                          {mCase.service?.serviceName}
                        </div>
                        <div className="text-sm">
                          <span className="text-grey">Requester:</span>{" "}
                          {mCase.requester.username}
                        </div>
                        <div className="text-sm">
                          <span className="text-grey">Provider:</span>{" "}
                          {mCase.provider.username}
                        </div>
                        <div className="text-sm">
                          <span className="text-grey">Requested:</span>{" "}
                          {new Date(
                            mCase.mediationRequestedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : resolvedCases.length === 0 ? (
                <p className="text-grey italic">No resolved mediation cases</p>
              ) : (
                <div className="space-y-2">
                  {resolvedCases.map((mCase) => (
                    <div
                      key={mCase._id}
                      className={`p-3 rounded-md cursor-pointer border ${
                        activeCase && activeCase._id === mCase._id
                          ? "border-p bg-p/10"
                          : "border-grey hover:bg-light-grey"
                      }`}
                      onClick={() => fetchCaseDetails(mCase._id)}
                    >
                      <div className="font-semi-bold">
                        {mCase.service?.serviceName || "Unknown Service"}
                      </div>
                      <div className="text-sm">
                        <span className="text-grey">Requester:</span>{" "}
                        {mCase.requester?.username || "Unknown"}
                      </div>
                      <div className="text-sm">
                        <span className="text-grey">Provider:</span>{" "}
                        {mCase.provider?.username || "Unknown"}
                      </div>
                      <div className="text-sm">
                        <span className="text-grey">Resolved:</span>{" "}
                        {formatDate(mCase.mediationResolvedAt)}
                      </div>
                      <div className="text-sm mt-1 text-p">
                        Credits: {mCase.finaltimeCredits}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case Details */}
            <div className="w-2/3 bg-white rounded-lg shadow-md p-4 max-h-[680px] overflow-y-auto">
              {!activeCase ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-grey">Select a case to see details</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-h2 font-semi-bold">Case Details</h2>
                    {activeCase.status === "in mediation" && (
                      <button
                        className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                        onClick={openDecisionModal}
                      >
                        Resolve Mediation
                      </button>
                    )}
                    {activeCase.status === "mediation resolved" && (
                      <span className="bg-p/50 text-p px-3 py-1 rounded-full text-small font-semi-bold">
                        Resolved on {formatDate(activeCase.mediationResolvedAt)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-h3 font-semi-bold mb-2">
                        Service Information
                      </h3>
                      <p>
                        <span className="font-semi-bold">Service:</span>{" "}
                        {activeCase.service.serviceName}
                      </p>
                      <p>
                        <span className="font-semi-bold">
                          Original Duration:
                        </span>{" "}
                        {activeCase.serviceDuration}h
                      </p>
                      <p>
                        <span className="font-semi-bold">Mediation Requested At:</span>{" "}
                        {activeCase.mediationRequestedAt &&
                          new Date(activeCase.mediationRequestedAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-h3 font-semi-bold mb-2">
                        Dispute Information
                      </h3>
                      <p>
                        <span className="font-semi-bold">
                          Claimed Duration:
                        </span>{" "}
                        {activeCase.actualDuration}h
                      </p>
                      <p>
                        <span className="font-semi-bold">
                          Proposed Credits:
                        </span>{" "}
                        {activeCase.proposedCredits}
                      </p>
                      <p>
                        <span className="font-semi-bold">Dispute Reason:</span>{" "}
                        {activeCase.disputeReason}
                      </p>
                    </div>
                  </div>

                  {activeCase.status === "mediation resolved" && (
                    <div className="bg-p/20 p-4 rounded-md mb-6 border border-p">
                      <h3 className="text-h3 font-semi-bold mb-2 text-p">
                        Resolution
                      </h3>
                      <p>
                        <span className="font-medium">Final Credits:</span>{" "}
                        {activeCase.finaltimeCredits}
                      </p>
                      <p>
                        <span className="font-medium">Decision:</span>{" "}
                        {activeCase.mediationDecision}
                      </p>
                      <p>
                        <span className="font-medium">Resolved By:</span> Admin
                      </p>
                      <p>
                        <span className="font-medium">Resolved On:</span>{" "}
                        {formatDate(activeCase.mediationResolvedAt)}
                      </p>
                      <p>
                        <span className="font-medium">
                          Credit Transfer Status:
                        </span>{" "}
                        {activeCase.creditTransferred
                          ? "Transferred"
                          : "Pending"}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-h3 font-semi-bold">Communication</h3>
                      <button
                        className="text-p text-small hover:underline"
                        onClick={() => fetchMediationMessages(activeCase._id)}
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="bg-light-grey p-4 rounded-md h-64 overflow-y-auto mb-2">
                      {mediationMessages.length > 0 ? (
                        mediationMessages.map((msg) => {
                          const isFromMediator = msg.isFromMediator;
                          const isFromRequester =
                            !isFromMediator &&
                            msg.sender === activeCase.requester._id;
                          const isResolution =
                            activeCase.status === "mediation resolved" &&
                            isFromMediator &&
                            activeCase.mediationDecision === msg.message;
                          return (
                            <div
                              key={msg._id}
                              className={`p-2 mb-2 rounded-md ${
                                isResolution
                                  ? "bg-p/20 border border-p/50 text-p"
                                  : isFromMediator
                                  ? "bg-s/20 ml-auto max-w-[80%]"
                                  : isFromRequester
                                  ? "bg-p/20 max-w-[80%]"
                                  : "bg-dark-grey/50 max-w-[80%]"
                              }`}
                            >
                              <div className="text-small text-grey mb-1">
                                {msg.isFromMediator
                                  ? "Mediator"
                                  : msg.senderName}{" "}
                                • {formatMessageTime(msg.timestamp)}
                              </div>
                              <div className="whitespace-pre-line">
                                {msg.message}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-grey italic">No messages yet</p>
                      )}
                    </div>
                    {activeCase.status === "in mediation" && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 p-2 border rounded"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            sendMediationMessage()
                          }
                          disabled={sendingMessage}
                        />
                        <button
                          className={`bg-p hover:bg-p/90 text-white px-3 py-1 rounded ${
                            sendingMessage || !newMessage.trim()
                              ? "opacity-70 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={sendMediationMessage}
                          disabled={sendingMessage || !newMessage.trim()}
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
              )}
            </div>
          </div>
        </div>

        {/* Decision Modal */}
        {showDecisionModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
              <h2 className="text-h2 font-bold mb-4">Resolve Mediation</h2>

              <label className="font-semi-bold text-h3">
                Final Time Credits
              </label>
              <input
                type="number"
                placeholder="Final credits to award"
                className="w-full p-2 border rounded mb-4"
                value={proposedCredits}
                onChange={(e) => setProposedCredits(e.target.value)}
              />

              <label className="font-semi-bold text-h3">
                Decision Explanation
              </label>
              <textarea
                placeholder="Explain your decision..."
                className="w-full p-2 border rounded mb-4"
                rows={4}
                value={mediationDecision}
                onChange={(e) => setMediationDecision(e.target.value)}
              />

              <div className="flex justify-between mt-4">
                <button
                  className="bg-white border text-error border-error hover:bg-error hover:text-white px-4 py-2 rounded"
                  onClick={() => setShowDecisionModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                  onClick={submitMediationDecision}
                >
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMediation;
