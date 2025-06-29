import React, {useEffect, useState} from 'react'
import Navbar from "../components/Navbar";
import axios from "axios";
import { FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';
import SpecificTransaction from "../components/SpecificTransaction";

function Transactions() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;


  const handleTransactionClick = (transaction) => {
    const outgoing = determineIsOutgoing(transaction);
    const counterparty = determineCounterparty(transaction);
    setSelectedTransaction({
      ...transaction,
      _isOutgoing: outgoing,
      _counterparty: counterparty,
    });
  };

    useEffect(() => {
      const getCurrentUser = async () => {
        try {
          const { data } = await axios.get(`${apiUrl}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(data);
        } catch (err) {
          console.error("Error fetching current user:", err);
        }
      };
  
      getCurrentUser();
    }, [apiUrl, token]);

  useEffect(() => {
    fetchTransactions();
  }, [apiUrl, token]);

  useEffect(() => {
    let result = [...transactions];
    
    if (filter === "incoming") {
      result = result.filter(t => 
        (t.recipient?._id && t.recipient._id === currentUser?._id)
      );
    } else if (filter === "outgoing") {
      result = result.filter(t => 
        (t.sender?._id && t.sender._id === currentUser?._id) || 
        t.type === "service_payment"
      );
    } else if (filter === "purchase") {
      result = result.filter(t => t.type === "purchase");
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.bookingId?.service && t.bookingId.service.toLowerCase().includes(term)) ||
        (t.recipient?.username && t.recipient.username.toLowerCase().includes(term)) ||
        (t.details && t.details.toLowerCase().includes(term))
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        } else if (sortConfig.key === 'service') {
          aValue = a.bookingId?.service || '';
          bValue = b.bookingId?.service || '';
        } else if (sortConfig.key === 'recipient') {
          aValue = a.recipient?.username || '';
          bValue = b.recipient?.username || '';
        } else if (sortConfig.key === 'amount') {
          aValue = a.amount;
          bValue = b.amount;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTransactions(result);
  }, [transactions, filter, searchTerm, sortConfig,  currentUser]);

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await axios.get(`${apiUrl}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(data);
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions.");
      }
      finally {
        setIsLoading(false);
    };
    };

    const handleSort = (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    };
  
    const getSortIndicator = (key) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };
  
    const exportToCsv = () => {
      const headers = ['Date', 'Transaction ID', 'Service Name', 'Transferred To', 'Time Credits', 'Status', 'Type', 'Details'];
      
      const csvData = filteredTransactions.map(t => [
        new Date(t.createdAt).toLocaleString(),
        t.transactionId || t._id,
        t.bookingId?.service || (t.type === "purchase" ? "Credit Purchase" : "Direct Transfer"),
        t.recipient?.username || 'N/A',
        t.creditAmount || t.amount,
        t.status,
        t.type,
        t.details || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'transaction_history.csv');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Determine if transaction is outgoing
const determineIsOutgoing = (transaction) => {
  if (!currentUser) return false;
  
  // For purchases
  if (transaction.type === "purchase") {
    return false;
  }
  if (transaction.type === "service_payment" && 
    transaction.details?.includes("Mediation resolved")) {
  
  const detailsText = transaction.details || "";
  if (detailsText.includes("from") && detailsText.includes("to")) {
    const fromUser = detailsText.split("from ")[1]?.split(" to ")[0]?.trim();
    
    if (fromUser === "user" && 
        transaction.sender?._id?.toString() === currentUser._id?.toString()) {
      return true;
    }
    if (fromUser === currentUser.username) {
      return true;
    }
  }
  return transaction.sender?._id?.toString() === currentUser._id?.toString();
}
  return transaction.sender?._id?.toString() === currentUser._id?.toString();
};

const determineCounterparty = (transaction) => {
  if (!currentUser) return "N/A";
  
  if (transaction.type === "purchase") {
    return "Khalti";
  }

  if (transaction.type === "service_payment" && transaction.details?.includes("Mediation resolved")) {
    const detailsText = transaction.details || "";
    if (detailsText.includes("from") && detailsText.includes("to")) {
      const fromUser = detailsText.split("from ")[1]?.split(" to ")[0]?.trim();
      const toUser = detailsText.split(" to ")[1]?.trim();
      if (fromUser === currentUser.username || 
          transaction.sender?._id?.toString() === currentUser._id?.toString()) {
        return toUser;
      }
      if (toUser === currentUser.username || 
          transaction.recipient?._id?.toString() === currentUser._id?.toString()) {
        return fromUser;
      }
    }
  }
  if (transaction.sender?._id?.toString() === currentUser._id?.toString()) {
    return transaction.recipient?.username || "N/A";
  } else {
    return transaction.sender?.username || "N/A";
  }
};

const getStatusBadge = (status) => {
  const statusStyles = {
    'completed': 'bg-p/10 text-p',
    'pending': 'bg-yellow-200 text-yellow-800',
    'failed': 'bg-error/10 text-error',
    'rejected': 'bg-error/10 text-error'
  };

  const style = statusStyles[status?.toLowerCase()] || 'bg-grey text-white';
  return (
    <span className={`text-xs px-2 py-1 rounded-md ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const paginatedTransactions = filteredTransactions.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

useEffect(() => {
  setCurrentPage(1);
}, [filter, searchTerm]);

  return (
    <div className ="flex flex-col min-h-screen font-poppins">
       <Navbar/>
       <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Section */}
          <div className="bg-p/70 p-6">
            <h1 className="text-h2 font-bold text-white">Transaction History</h1>
            <p className=" mt-1">Track all your time credit transfers</p>
          </div>

          {/* Filters and Actions */}
          <div className="p-4 bg-light-grey border-b border-dark-grey flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search service or user..."
                  className="pl-3 pr-10 py-2 border border-dark-grey rounded-md focus:outline-none w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-dark-grey">
                  {searchTerm ? (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="text-light-grey hover:text-dark-grey"
                    >
                      ✕
                    </button>
                  ) : (
                    <span>🔍</span>
                  )}
                </span>
              </div>

              <select
                className="bg-white border border-dark-grey rounded-md py-2 px-3 focus:outline-none "
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="incoming">Incoming Only</option>
                <option value="outgoing">Outgoing Only</option>
              </select>
            </div>

            <div className="flex gap-2 w-full justify-between sm:w-auto">
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-1 py-2 px-3 bg-white text-p rounded-md border border-p hover:bg-p/50 hover:text-white"
              >
                <FiRefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={exportToCsv}
                className="flex items-center gap-1 py-2 px-3 bg-white text-p rounded-md border border-p hover:bg-p/50 hover:text-white"
              >
                <FiDownload size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="overflow-x-auto">
            {error && (
              <div className="text-center p-4 text-error">
                <p>{error}</p>
                <button 
                  onClick={fetchTransactions}
                  className="mt-2 text-smallall font-medium text-p hover:bg-p/90"
                >
                  Try Again
                </button>
              </div>
            )}
            {isLoading ? (
              <div className="text-center p-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-p border-t-transparent"></div>
                <p className="mt-2 text-dark-grey">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
              <table className="w-full border-collapse hidden md:table">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th 
                      className="p-4 font-semi-bold text-h3  cursor-pointer hover:bg-light-grey"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date {getSortIndicator('createdAt')}
                    </th>
                    <th 
                      className="p-4 font-semi-bold text-h3 cursor-pointer hover:bg-light-grey"
                      onClick={() => handleSort('service')}
                    >
                      Service Name {getSortIndicator('service')}
                    </th>
                    <th 
                      className="p-4 font-semi-bold text-h3 cursor-pointer hover:bg-light-grey"
                      onClick={() => handleSort('recipient')}
                    >
                      Counter Party {getSortIndicator('recipient')}
                    </th>
                    <th 
                      className="p-4 font-semi-bold text-h3 cursor-pointer hover:bg-light-grey text-right"
                      onClick={() => handleSort('amount')}
                    >
                      Time Credits {getSortIndicator('amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => {
                   const isOutgoing = determineIsOutgoing(transaction);
                    const amountPrefix = isOutgoing ? "-" : "+";
                    const amountClass = isOutgoing ? "text-error" : "text-p";
                    const transferredLabel = determineCounterparty(transaction);
                    let serviceName = "Direct Transfer";
                    if (transaction.type === "purchase") {
                      serviceName = "Credit Purchase";
                    }else if (transaction.type === "khalti-cashout") {
                      serviceName = "Cashout";
                     }
                      else if (transaction.type === "mediation_transfer"|| 
                      (transaction.type === "service_payment" && transaction.details?.includes("Mediation resolved"))) { 
                      serviceName = "Mediation Resolution";
                    } else if (transaction.bookingId?.service) {
                      serviceName = transaction.bookingId.service;
                    }
                    console.log({
                      transactionId: transaction._id,
                      transactionType: transaction.type,
                      details: transaction.details,
                      senderId: transaction.sender?._id,
                      userId: currentUser?._id,
                      isSender: transaction.sender?._id?.toString() === currentUser?._id?.toString(),
                      hasFromUser: transaction.details?.includes("from user"),
                      isOutgoing: isOutgoing
                    });
                    return (
                    <tr 
                      key={transaction._id} 
                      className="border-t border-dark-grey hover:bg-light-grey"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <td className="p-4 text-small ">
                        <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-dark-grey">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4 text-small">
                        {serviceName}
                      </td>
                      <td className="p-4 text-small">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-p/10 rounded-full flex items-center justify-center font-bold text-p uppercase">
                        {transferredLabel.charAt(0)}
                      </div>
                      <span>{transferredLabel}</span>
                      </div>
                    </td>
                      <td className={`p-4 text-small font-h3 text-right ${amountClass}`}>
                      <div className="flex items-center justify-end gap-2">
                      <span className={`${amountClass}`}>
                      {amountPrefix}{transaction.creditAmount || transaction.amount} Credits
                      </span>
                      {getStatusBadge(transaction.status)}
                      </div>
                      </td>
                    </tr>
                    );
                    })}
                </tbody>
              </table>
              <div className="md:hidden space-y-4 mt-4">
              {paginatedTransactions.map((transaction) => {
              const isOutgoing = determineIsOutgoing(transaction);
              const amountPrefix = isOutgoing ? "-" : "+";
              const amountClass = isOutgoing ? "text-error" : "text-p";
              const transferredLabel = determineCounterparty(transaction);
              return(
                <div key={transaction._id} className="bg-white shadow-sm p-4 rounded-md border border-dark-grey"
                onClick={() => handleTransactionClick(transaction)}>
                  <div className="flex justify-between items-center text-small font-medium">
                    <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                    <span className={`${amountClass}`}>
                      {amountPrefix}{transaction.creditAmount || transaction.amount} Credits
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </span>
                  </div>
                  <div className="text-xs text-dark-grey mt-1">
              {new Date(transaction.createdAt).toLocaleTimeString()}
            </div>
            <div className="mt-2">
              <p className="font-bold">{transaction.type === "purchase" 
              ? "Credit Purchase" 
              : transaction.type === "mediation_transfer" || 
                (transaction.type === "service_payment" && transaction.details?.includes("Mediation resolved"))
                ? "Mediation Resolution"
                : transaction.bookingId?.service || "Direct Transfer"}</p>
              <p className="text-sm">
              {isOutgoing ? "To" : "From"}: {transferredLabel}
              </p>
              {transaction.details && <p className="text-xs text-grey mt-1">{transaction.details}</p>}
            </div>
    </div>
              );
              })}
            </div>
            
          </>
            ) : (
              <div className="text-center p-8">
                <p className="text-dark-grey">No transactions found.</p>
                {(filter !== "all" || searchTerm) && (
                  <button 
                    onClick={() => {
                      setFilter("all");
                      setSearchTerm("");
                    }}
                    className="mt-2 text-small font-medium text-p hover:bg-p/90"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination (if needed) */}
          {filteredTransactions.length > 0 && (
            <div className="bg-light-grey px-4 py-3 flex items-center justify-between border-t border-dark-grey sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-small text-grey">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of
                    <span className="font-medium">{filteredTransactions.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button 
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-dark-grey bg-white text-small font-medium text-dark-grey hover:bg-light-grey">
                      Previous
                    </button>
                    {[...Array(Math.ceil(filteredTransactions.length / itemsPerPage))].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-small font-medium ${
                          currentPage === i + 1
                            ? "bg-p/30 border-p text-p"
                            : "bg-white text-dark-grey border border-dark-grey hover:bg-light-grey"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                    onClick={() =>
                      setCurrentPage((prev) =>
                        prev < Math.ceil(filteredTransactions.length / itemsPerPage)
                          ? prev + 1
                          : prev
                      )
                    }
                    disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-dark-grey bg-white text-small font-medium text-dark-grey hover:bg-light-grey">
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          {selectedTransaction && (
          <SpecificTransaction
            transaction={selectedTransaction}
            isOutgoing={selectedTransaction._isOutgoing}
            counterparty={selectedTransaction._counterparty}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
        </div>
      </div>
       </div>
  )
}

export default Transactions