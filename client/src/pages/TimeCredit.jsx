import React, {useState, useRef, useEffect} from 'react'
import KhaltiPayment from "../components/Khalti"
import CashoutForm from "../components/CashoutForm"
import { NavLink } from "react-router-dom";
import CashoutHistory from "../pages/CashoutHistory"
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TimeCredit() {
    const navigate = useNavigate();
    const [creditAmount, setCreditAmount] = useState(10); 
    const [currentCredits, setCurrentCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [recentTransaction, setRecentTransaction] = useState(null);
    const [cashoutOpen, setCashoutOpen] = useState(false);
    const [recentCashout, setRecentCashout] = useState(null);
    const [pricePerCredit, setPricePerCredit] = useState(1); 
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('token');

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

    const fetchPricePerCredit = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPricePerCredit(data.pricePerCredit || 1);
      } catch (err) {
        console.error("Failed to fetch price per credit");
      }
    };
  
    fetchPricePerCredit();

    const pendingTransaction = localStorage.getItem('pendingTransaction');
    if (pendingTransaction) {
      const txData = JSON.parse(pendingTransaction);
      setRecentTransaction(txData);

      if (Date.now() - txData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pendingTransaction');
        setRecentTransaction(null);
      }
    }
    const pendingCashout = localStorage.getItem('pendingCashout');
    if (pendingCashout) {
      const cashoutData = JSON.parse(pendingCashout);
      setRecentCashout(cashoutData);
      
      if (Date.now() - cashoutData.timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 days expiry
        localStorage.removeItem('pendingCashout');
        setRecentCashout(null);
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

  const handleCashoutSuccess = (data) => {
    setCurrentCredits(data.remainingCredits);
    setCashoutOpen(false);
    const cashoutInfo = {
      id: data.transaction.id,
      amount: data.transaction.amount,
      credits: data.transaction.credits,
      khaltiToken: data.transaction.khaltiToken || '',
      status: data.transaction.status || 'pending',
      timestamp: Date.now()
    };
  
    if (data.transaction.status === 'completed') {
      toast.success("Credits transferred to your Khalti wallet successfully!");
    } else if (data.transaction.status === 'pending') {
      toast.success("Cashout request submitted successfully!");
      localStorage.setItem('pendingCashout', JSON.stringify(cashoutInfo));
      setRecentCashout(cashoutInfo);
    } else {
      toast.warn(`Cashout status: ${data.transaction.status}`);
    }
  };

  const toggleDetails = () => {
    setDetailsOpen(!detailsOpen);
    setCashoutOpen(false);
  };

  const toggleCashout = () => {
    setCashoutOpen(true);
    setDetailsOpen(false);
    console.log("Cashout popup");
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
    <div className="flex items-center justify-center min-h-screen bg-light-grey font-poppins">
      <div className="md:bg-white p-8 rounded-xl sm:hadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
        <div onClick={() => navigate("/home")} className="flex items-center hover:text-p p-2 rounded-full hover:bg-light-grey md:hidden">
            <ArrowLeft className="w-6 h-6" />
            <span className="sr-only">Back to Profile</span>
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
                  className="mt-2 text-body bg-p hover:bg-p/90 text-white py-1.5 px-3 rounded-md transition duration-200"
                >
                  Verify Payment
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            className="w-full flex items-center justify-center bg-p hover:bg-p/90 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md"
            onClick={toggleDetails}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Buy Time Credits
          </button>
          <button 
            className="flex items-center justify-center bg-p hover:bg-p/90 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md"
            onClick={toggleCashout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Cash Out
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-dark-grey">
          Need help? Contact our <a href="#" className="text-p hover:underline">support team</a>
        </div>
        </div>
          
          {detailsOpen && (
            <div className="fixed inset-0 bg-grey bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl  transition-all duration-300">
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
            </div>
          )}
          {cashoutOpen && (
        <div className="fixed inset-0 bg-grey bg-opacity-50 flex items-center justify-center z-50 p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl transition-all duration-300">
            <CashoutForm 
              currentCredits={currentCredits > 0 ? currentCredits : 10} 
              onSuccess={handleCashoutSuccess}
              onClose={() => setCashoutOpen(false)}
            />
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}

export default TimeCredit