import React, { useImperativeHandle, forwardRef, useEffect, useState } from "react";
import axios from "axios";
import {toast} from "react-toastify";

const Khalti = ({ creditAmount, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const pricePerCredit = 2; 

  const initiatePayment = async () => {
    if (creditAmount <= 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }

    setIsLoading(true);
    
    try {
      const amountInPaisa = creditAmount * pricePerCredit * 100;
      
      const response = await axios.post(
        `${apiUrl}/api/payment/initiate`,
        {
          amount: amountInPaisa,
          creditAmount: creditAmount
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.data && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
      
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Failed to initiate payment. Please try again.");
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="bg-[#5D2E8F] text-white px-4 py-2 rounded-lg w-full"
      onClick={initiatePayment}
      disabled={isLoading}
    >
       {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {/* <img 
            src="https://khalti.com/static/img/khalti-logo.svg" 
            alt="Khalti Logo" 
            className="h-5 w-5 mr-2" 
          /> */}
          Pay with Khalti
        </>
      )}
    </button>
  );
};


export default Khalti;