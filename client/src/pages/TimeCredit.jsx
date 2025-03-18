import React, {useState, useRef, useEffect} from 'react'
import Khalti from "../components/Khalti"
import axios from "axios";
import { toast } from "react-toastify";

function TimeCredit() {
    const khaltiRef = useRef(null);
    const [creditAmount, setCreditAmount] = useState(10); 
    const [currentCredits, setCurrentCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
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
  }, [apiUrl, token]);


  const handlePayment = () => {
    if (khaltiRef.current) {
      if (creditAmount <= 0) {
        toast.error("Please enter a valid credit amount");
        return;
      }
      const totalAmount = creditAmount * pricePerCredit * 100;
      console.log(`Buying ${creditAmount} credits for ${totalAmount} paisa`);
      
      khaltiRef.current.handlePayment(totalAmount);
    } else {
      toast.error("Payment system not ready. Please try again.");
    }
  };

  const toggleDetails = () => {
    setDetailsOpen(!detailsOpen);
  };
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-light-grey">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h1 className="text-s text-h2 font-semi-bold ">My Time Credits</h1>
        <div className="p-4 bg-gray-200 rounded-lg">
          <h2 className="text-lg font-semi-bold text-grey">Time Credit Balance: <span className="text-blue-600">{currentCredits}</span></h2>
          <p className="text-grey mt-2">Time Credit Status: <span className="font-medium text-green-600">Active</span></p>
        </div>
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
                onChange={(e) => setCreditAmount(Math.max(1, Number(e.target.value)))}
                className="border p-2 rounded w-full mb-3"
              />
              <p className="text-lg font-medium pb-2">
                Total: Rs. {creditAmount * pricePerCredit}
              </p>
              <button
                className="bg-[#5D2E8F] text-white px-4 py-2 rounded-lg w-full"
                onClick={handlePayment}
              >
                Pay with Khalti
              </button>
            </div>
          )}
        </div>
      </div>
      <Khalti 
        ref={khaltiRef}
        onSuccess={(data) => {
          setCurrentCredits(data.credits || currentCredits + creditAmount);
          setDetailsOpen(false);
        }}
      />
    </div>
  );
}

export default TimeCredit