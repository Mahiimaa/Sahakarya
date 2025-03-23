import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";

const AdminMediation = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [mediationCases, setMediationCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [mediationMessages, setMediationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediationDecision, setMediationDecision] = useState("");
  const [proposedCredits, setProposedCredits] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  useEffect(() => {
    fetchMediationCases();
  }, []);

  const fetchMediationCases = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/mediation/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMediationCases(data);
    } catch (error) {
      console.error("Error fetching mediation cases:", error);
      toast.error("Failed to load mediation cases");
    }
  };

  const fetchCaseDetails = async (caseId) => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/mediation/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveCase(data);
      fetchMediationMessages(caseId);
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast.error("Failed to load case details");
    }
  };

  const fetchMediationMessages = async (caseId) => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/bookings/${caseId}/mediation-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMediationMessages(data);
    } catch (error) {
      console.error("Error fetching mediation messages:", error);
    }
  };

  const sendMediationMessage = async () => {
    if (!newMessage.trim() || !activeCase) return;
    
    try {
      await axios.post(
        `${apiUrl}/api/bookings/${activeCase._id}/mediation-messages`,
        { message: newMessage, isFromMediator: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      fetchMediationMessages(activeCase._id);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Error sending message");
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
          finalCredits: proposedCredits 
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-h1 font-bold mb-6">Mediation Dashboard</h1>
        
        <div className="flex gap-6">
          {/* Case List */}
          <div className="w-1/3 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-h2 font-semibold mb-4">Mediation Cases</h2>
            
            {mediationCases.length === 0 ? (
              <p className="text-grey italic">No active mediation cases</p>
            ) : (
              <div className="space-y-2">
                {mediationCases.map((mCase) => (
                  <div 
                    key={mCase._id}
                    className={`p-3 rounded-md cursor-pointer border ${
                      activeCase && activeCase._id === mCase._id 
                        ? "border-p bg-p/10" 
                        : "border-grey hover:bg-light-grey"
                    }`}
                    onClick={() => fetchCaseDetails(mCase._id)}
                  >
                    <div className="font-medium">{mCase.service.serviceName}</div>
                    <div className="text-sm">
                      <span className="text-grey">Requester:</span> {mCase.requester.username}
                    </div>
                    <div className="text-sm">
                      <span className="text-grey">Provider:</span> {mCase.provider.username}
                    </div>
                    <div className="text-sm">
                      <span className="text-grey">Requested:</span> {new Date(mCase.mediationRequestedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Case Details */}
          <div className="w-2/3 bg-white rounded-lg shadow-md p-4">
            {!activeCase ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-grey">Select a case to see details</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-h2 font-semibold">Case Details</h2>
                  <button
                    className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                    onClick={openDecisionModal}
                  >
                    Resolve Mediation
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-h3 font-medium mb-2">Service Information</h3>
                    <p><span className="font-medium">Service:</span> {activeCase.service.serviceName}</p>
                    <p><span className="font-medium">Original Duration:</span> {activeCase.serviceDuration}h</p>
                    <p><span className="font-medium">Completed At:</span> {activeCase.completedAt && new Date(activeCase.completedAt).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-h3 font-medium mb-2">Dispute Information</h3>
                    <p><span className="font-medium">Claimed Duration:</span> {activeCase.actualDuration}h</p>
                    <p><span className="font-medium">Proposed Credits:</span> {activeCase.proposedCredits}</p>
                    <p><span className="font-medium">Dispute Reason:</span> {activeCase.disputeReason}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-h3 font-medium mb-2">Communication</h3>
                  <div className="bg-light-grey p-4 rounded-md h-64 overflow-y-auto mb-2">
                    {mediationMessages.length > 0 ? (
                      mediationMessages.map((msg) => (
                        <div 
                          key={msg._id} 
                          className={`p-2 mb-2 rounded-md ${
                            msg.isFromMediator 
                              ? "bg-s/20 ml-auto max-w-[80%]" 
                              : msg.sender === activeCase.requester._id 
                                ? "bg-p/20 max-w-[80%]" 
                                : "bg-grey/20 max-w-[80%]"
                          }`}
                        >
                          <div className="text-xs text-dark-grey mb-1">
                            {msg.isFromMediator ? "Mediator" : msg.senderName} • {new Date(msg.timestamp).toLocaleString()}
                          </div>
                          <div>{msg.message}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-grey italic">No messages yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      className="bg-p hover:bg-p/90 text-white px-3 py-1 rounded"
                      onClick={sendMediationMessage}
                    >
                      Send
                    </button>
                  </div>
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
            
            <label className="font-semi-bold text-h3">Final Time Credits</label>
            <input 
              type="number" 
              placeholder="Final credits to award"
              className="w-full p-2 border rounded mb-4"
              value={proposedCredits} 
              onChange={(e) => setProposedCredits(e.target.value)}
            />
            
            <label className="font-semi-bold text-h3">Decision Explanation</label>
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
  );
};

export default AdminMediation;