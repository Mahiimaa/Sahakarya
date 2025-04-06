import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const SpecificTransaction = ({ transaction, onClose, isOutgoing, counterparty }) => {
    const [status, setStatus] = useState(transaction.status);
    const [checking, setChecking] = useState(false);
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const isCashoutPending = transaction.type === 'cashout' && transaction.status === 'pending';

    useEffect(() => {
        const checkCashoutStatus = async () => {
        if (!isCashoutPending) return;

        setChecking(true);
        try {
            const { data } = await axios.get(`${apiUrl}/api/status/${transaction._id}`, {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (data.status && data.status !== status) {
            setStatus(data.status);
            toast.info(`Cashout updated: ${data.status}`);
            }
        } catch (err) {
            console.error("Failed to update cashout status", err);
            toast.error("Failed to check cashout status.");
        } finally {
            setChecking(false);
        }
        };

        checkCashoutStatus();
    }, [transaction, apiUrl, token, isCashoutPending, status]);

    const getStatusBadge = (status) => {
        const base = "capitalize font-medium text-sm rounded-full px-3 py-1";
        if (checking) return `${base} bg-yellow-100 text-yellow-800 animate-pulse`;

        switch (status) {
        case 'pending': return `${base} bg-yellow-100 text-yellow-800`;
        case 'processing': return `${base} bg-blue-100 text-blue-800`;
        case 'completed': return `${base} bg-green-100 text-green-800`;
        case 'failed': return `${base} bg-red-100 text-red-800`;
        case 'rejected': return `${base}'bg-error/10 text-error'`;
        default: return `${base} bg-gray-100 text-gray-800`;
        }
    };
    
    const amountPrefix = isOutgoing ? "-" : "+";
    const amountClass = isOutgoing ? "text-error" : "text-p";
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Transaction Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">Transaction ID</p>
              <p className="font-medium">{transaction.transactionId || transaction._id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Date & Time</p>
              <p className="font-medium">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Type</p>
              <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className="font-medium capitalize">{transaction.status}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Service</p>
              <p className="font-medium">
                {transaction.type === "purchase" 
                  ? "Credit Purchase" 
                  : transaction.type === "mediation_transfer" || 
                    (transaction.type === "service_payment" && transaction.details?.includes("Mediation resolved"))
                    ? "Mediation Resolution"
                    : transaction.bookingId?.service || "Direct Transfer"}
              </p>
            </div>
            <div>
            <p className="text-gray-500 text-sm">{isOutgoing ? "Sent To" : "Received From"}</p>
            <p className="font-medium">{counterparty}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-sm">Amount</p>
              <p className={`font-bold text-lg ${amountClass}`}>
                {amountPrefix}{transaction.creditAmount || transaction.amount} Credits
              </p>
            </div>
          </div>
          
          {transaction.details && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm mb-1">Details</p>
              <p>{transaction.details}</p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button 
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default SpecificTransaction;