import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function CashoutForm({ currentCredits, onSuccess, onClose }) {
  const [creditAmount, setCreditAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [khaltiId, setKhaltiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const cashValuePerCredit = 1;

  const handleCreditChange = (e) => {
    const value = parseInt(e.target.value);
    setCreditAmount(isNaN(value) ? 1 : Math.max(1, Math.min(value, currentCredits)));
  };

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^9\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (creditAmount > currentCredits) {
      toast.error(`You only have ${currentCredits} credits available`);
      return;
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      toast.error("Please provide a valid phone number (10 digits, starting with 9)");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${apiUrl}/api/cashout/khalti`,
        {
          creditAmount,
          phoneNumber,
          remarks: remarks || `Cashout for ${creditAmount} credits`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      toast.success("Cashout request submitted successfully!");
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error("Error requesting cashout:", error);
      const errorMessage = error.response?.data?.message || "Failed to process cashout request";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-h3 font-semi-bold">Cash Out Credits</h3>
        <button onClick={onClose} className="text-grey">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-body font-medium mb-2">
            Credits to Cash Out
          </label>
          <div className="flex">
            <button
              type="button"
              className="bg-light-grey hover:bg-dark-grey text-grey font-bold py-2 px-4 rounded-l"
              onClick={() => setCreditAmount(Math.max(1, creditAmount - 1))}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={currentCredits}
              value={creditAmount}
              onChange={handleCreditChange}
              className="border-t border-b border-grey py-2 px-4 text-center w-full"
            />
            <button
              type="button"
              className="bg-light-grey hover:bg-dark-grey text-grey font-bold py-2 px-4 rounded-r"
              onClick={() => setCreditAmount(Math.min(currentCredits, creditAmount + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-body font-medium mb-2">
            Your Khalti Account
          </label>
          <input
            type="text"
            placeholder="Phone Number (e.g., 9801234567)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border border-grey rounded-lg py-2 px-4 w-full mb-2"
            required
          />
          <input
            type="text"
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="border border-grey rounded-lg py-2 px-4 w-full"
          />
          <p className="text-xs text-grey mt-1">
            The amount will be sent directly to your Khalti wallet associated with this phone number.
          </p>
        </div>

        <div className="bg-light-grey p-4 rounded-lg mb-5">
          <div className="flex justify-between">
            <span className="text-sm">Cash per credit:</span>
            <span className="text-sm font-medium">Rs. {cashValuePerCredit}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Cashout:</span>
            <span className="text-p">Rs. {creditAmount * cashValuePerCredit}</span>
          </div>
          <div className="mt-2 text-xs text-grey">
            Note: The amount will be instantly transferred to your Khalti wallet.
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || creditAmount <= 0 || creditAmount > currentCredits}
          className="w-full bg-[#5D2E8F] hover:bg-[#4c2273] text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:bg-grey flex justify-center items-center"
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              <img 
                src="https://khalti.com/static/img/khalti-logo.svg" 
                alt="Khalti Logo" 
                className="h-5 w-5 mr-2" 
              />
              Cashout to Khalti
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CashoutForm;