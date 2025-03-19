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

  const handleCreditChange = (e) => {
    const value = parseInt(e.target.value);
    setCreditAmount(isNaN(value) ? 1 : Math.max(1, value));
  };
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-grey">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-p/60 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-h2 font-semi-bold ml-3">My Time Credits</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-p"></div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-p to-p/80 p-6 rounded-lg mb-6 text-white shadow-md">
            <div className="flex justify-between items-center mb-4">
              <span className="text-h3 font-semi-bold">Current Balance</span>
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-body">Active</span>
              </div>
            </div>
            <div className="text-h2 font-bold mb-1">{currentCredits}</div>
            <div className="text-h3 text-s">Time Credits</div>
          </div>
        )}

        {recentTransaction && (
          <div className="mb-6 p-4 bg-p rounded-lg border border-p shadow-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-p mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semi-bold text-p text-sm">
                  Pending Transaction
                </p>
                <p className="text-p text-body my-1">
                  {recentTransaction.creditAmount} credits for Rs. {recentTransaction.amount/100}
                </p>
                <button 
                  onClick={handleManualVerify}
                  className="mt-2 text-body bg-p hover:bg-p text-white py-1.5 px-3 rounded-md transition duration-200"
                >
                  Verify Payment
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <button 
            className="w-full flex items-center justify-cente bg-p hover:bg-p/90 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md"
            onClick={toggleDetails}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Buy Time Credits
          </button>
          
          {detailsOpen && (
            <div className="absolute bg-white border border-dark-grey rounded-lg p-6 left-0 right-0 mt-3 shadow-xl z-10">
              <div className="flex justify-between items-center mb-4">
                <p className="text-h3 font-semi-bold">
                  Purchase Credits
                </p>
                <button 
                  onClick={toggleDetails}
                  className="text-grey"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="">
                <label className="block text-body font-medium">
                  Number of credits
                </label>
                <div className="flex">
                  <button 
                    className="bg-light-grey hover:bg-dark-grey text-grey font-bold py-2 px-4 rounded-l"
                    onClick={() => setCreditAmount(Math.max(1, creditAmount - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={handleCreditChange}
                    className="border-t border-b border-grey py-2 px-4 text-center w-full"
                  />
                  <button 
                    className="bg-light-grey hover:bg-dark-grey text-grey font-bold py-2 px-4 rounded-r"
                    onClick={() => setCreditAmount(creditAmount + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="bg-light-grey p-4 rounded-lg mb-5">
                <div className="flex justify-between">
                  <span className="text-sm">Price per credit:</span>
                  <span className="text-sm font-medium">Rs. {pricePerCredit}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-p">Rs. {creditAmount * pricePerCredit}</span>
                </div>
              </div>
              
              <KhaltiPayment 
                creditAmount={creditAmount}
                onSuccess={handlePaymentSuccess}
                onError={(error) => toast.error("Payment failed. Please try again.")}
                className="w-full bg-[purple] text-white font-medium py-3 px-4 rounded-lg transition duration-200"
              />
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          Need help? Contact our <a href="#" className="text-blue-600 hover:underline">support team</a>
        </div>
      </div>
    </div>
  );
}

export default TimeCredit