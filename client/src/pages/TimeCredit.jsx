import React, {useState, useRef, useEffect} from 'react'
import KhaltiPayment from "../components/Khalti"
import axios from "axios";
import { toast } from "react-toastify";

function TimeCredit() {
    const [creditAmount, setCreditAmount] = useState(10); 
    const [currentCredits, setCurrentCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [recentTransaction, setRecentTransaction] = useState(null);
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('token');
    const pricePerCredit = 100;

    useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentCredits(data.timeCredits || 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load your credit information");
        setIsLoading(false);
      }
    };

    fetchUserData();

    const pendingTransaction = localStorage.getItem('pendingTransaction');
    if (pendingTransaction) {
      const txData = JSON.parse(pendingTransaction);
      setRecentTransaction(txData);

      if (Date.now() - txData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pendingTransaction');
        setRecentTransaction(null);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const pidx = urlParams.get('pidx');
    
    if (status && pidx) {
        if (status === 'Completed') {
            verifyPayment(pidx);
        } else {
            toast.error(`Payment ${status.toLowerCase()}`);
        }
        const url = new URL(window.location);
        url.searchParams.delete('status');
        url.searchParams.delete('pidx');
        window.history.replaceState({}, '', url);
    }
    }, [apiUrl, token]);

  const verifyPayment = async (pidx) => {
      try {
        setIsLoading(true);
          const response = await axios.post(
              `${apiUrl}/api/payment/verify`,
              { pidx },
              {
                  headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json"
                  }
              }
          );
          
          setCurrentCredits(response.data.credits);
          toast.success("Credits purchased successfully!");
          localStorage.removeItem('pendingTransaction');
          setRecentTransaction(null);
      } catch (error) {
          console.error("Payment verification error:", error);
          const errorMessage = error.response?.data?.message || "Failed to verify payment. Please contact support.";
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
  };

  const handlePaymentSuccess = (data) => {
      setCurrentCredits(data.credits);
      setDetailsOpen(false);
      toast.success("Credits purchased successfully!");

      localStorage.removeItem('pendingTransaction');
      setRecentTransaction(null);
  };

  const toggleDetails = () => {
    setDetailsOpen(!detailsOpen);
  };

  const handleManualVerify = () => {
    if (recentTransaction && recentTransaction.pidx) {
      verifyPayment(recentTransaction.pidx);
    }
  };
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-grey">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h1 className="text-s text-h2 font-semi-bold ">My Time Credits</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-p"></div>
          </div>
        ) : (
          <div className="p-4 bg-gray-200 rounded-lg mb-4">
            <h2 className="text-lg font-semi-bold text-grey">Time Credit Balance: 
              <span className="text-blue-600 ml-2">{currentCredits}</span>
            </h2>
            <p className="text-grey mt-2">
              Time Credit Status: 
              <span className="font-medium text-green-600 ml-2">Active</span>
            </p>
          </div>
        )}
        {recentTransaction && (
          <div className="mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              You have a pending transaction
            </p>
            <p className="text-xs text-yellow-700 mb-2">
              {recentTransaction.creditAmount} credits for Rs. {recentTransaction.amount/100}
            </p>
            <button 
              onClick={handleManualVerify}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
            >
              Verify Payment
            </button>
          </div>
        )}
        <div className="relative">
          <button 
            className="w-full text-h3 text-p border border-p bg-white rounded-md p-2 hover:bg-p hover:text-white"
            onClick={toggleDetails}
          >
            Buy Time Credits
          </button>
          
          {detailsOpen && (
            <div className="absolute bg-white border border-grey rounded-lg p-4 left-0 right-0 mt-2 shadow-lg z-10">
              <p className="text-h3 font-semi-bold pb-4">
                Enter the number of credits:
              </p>
              <input
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Math.max(0, Number(e.target.value)))}
                className="border p-2 rounded w-full mb-3"
              />
              <p className="text-h2 font-medium pb-2">
                Total: Rs. {creditAmount * pricePerCredit}
              </p>
              <div className="mb-2 p-2 bg-grey/20 rounded text-sm text-grey">
                <p>1 credit = Rs. {pricePerCredit}</p>
              </div>
              <KhaltiPayment 
                creditAmount={creditAmount}
                onSuccess={handlePaymentSuccess}
                onError={(error) => toast.error("Payment failed. Please try again.")}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeCredit