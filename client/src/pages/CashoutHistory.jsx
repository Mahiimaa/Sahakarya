import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function CashoutHistory({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCashoutHistory = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${apiUrl}/api/cashout/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTransactions(data.transactions);
      } catch (error) {
        console.error("Error fetching cashout history:", error);
        toast.error("Failed to load your cashout history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCashoutHistory();
  }, [apiUrl, token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg font-poppins">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-h3 font-semi-bold">Cashout History</h3>
        <button onClick={onClose} className="text-grey">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-p"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-6 text-grey">
          You haven't made any cashout requests yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-light-grey">
              <tr>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Credits</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-light-grey hover:bg-gray-50">
                  <td className="py-3 px-4">{formatDate(tx.createdAt)}</td>
                  <td className="py-3 px-4">{tx.creditAmount}</td>
                  <td className="py-3 px-4">Rs. {tx.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-grey">
        Cashout requests are typically processed within 2-3 business days.
      </div>
    </div>
  );
}

export default CashoutHistory;