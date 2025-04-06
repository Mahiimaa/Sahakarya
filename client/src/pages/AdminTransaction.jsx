import React, {useState, useEffect} from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import axios from 'axios';
import { toast } from "react-toastify";
import {ArrowUpDown, Search, CreditCard, Clock} from 'lucide-react';

function AdminTransaction() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('All');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/admin/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: filterStatus === 'All' ? undefined : filterStatus,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction
        }
      });
      console.log("admin:", response);
      setTransactions(response.data.transactions);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to fetch transactions');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, searchTerm, filterStatus, sortConfig]);

  const StatusBadge = ({ status }) => {
    if (!status) return <span className="text-grey">N/A</span>;
    const statusStyles = {
      'completed': 'bg-p/10 text-p',
      'pending': 'bg-s/10 text-s',
      'failed': 'bg-error/10 text-error',
      'rejected': 'bg-error/10 text-error'
    };
    const lowercaseStatus = status.toLowerCase();
    return (
      <span className={`px-2 py-1 rounded-full text-small ${statusStyles[lowercaseStatus] || 'bg-grey text-white'}`}>
        {status}
      </span>
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await axios.patch(`${apiUrl}/api/transactions/${id}/status`, {
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      toast.success(`Transaction marked as ${status}`);
      fetchTransactions();
      setSelectedTransaction(null);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-screen">
        <div className="text-center">
          <h2 className="text-h2 text-error">Error Loading Transactions</h2>
          <p className="text-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className ="flex gap-4 font-poppins">
    <Navbar/>
    <div className="flex flex-col gap-4">
    <Topbar/>
    <div className="bg-screen p-4  border-none rounded-2xl">
     <div className="flex justify-between items-center mb-6">
     <h1 className="font-semi-bold text-h1 ">Transactions</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-p"
                />
                <Search className="absolute left-3 top-3 text-grey" size={20} />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-grey rounded-lg"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-p"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-small">
                  <thead className="bg-light-grey">
                    <tr>
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-dark-grey"
                        onClick={() => handleSort('transactionId')}
                      >
                        <div className="flex items-center gap-2">
                          Transaction ID 
                          <ArrowUpDown size={16} />
                        </div>
                      </th>
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-dark-grey"
                        onClick={() => handleSort('user')}
                      >
                        <div className="flex items-center gap-2">
                          User 
                          <ArrowUpDown size={16} />
                        </div>
                      </th>
                      <th className="p-3 text-left">Type</th>
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-dark-grey"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-2">
                          Amount 
                          <ArrowUpDown size={16} />
                        </div>
                      </th>
                      {/* <th className="p-3 text-left">Payment Method</th> */}
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-dark-grey"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-2">
                          Date 
                          <ArrowUpDown size={16} />
                        </div>
                      </th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((trans) => (
                      <tr key={trans._id} className="border-b hover:bg-light-grey" onClick={() => setSelectedTransaction(trans)}>
                        <td className="p-3 font-medium">{trans.transactionId}</td>
                        <td className="p-3">{trans.sender?.username || 
                          trans.sender?.name || 
                          trans.sender?.email || 
                          'Unknown Sender'}</td>
                        <td className="p-3">
                          <span className="flex items-center gap-2">
                            {trans.type === 'cashout' ? <CreditCard size={16} /> : <Clock size={16} />}
                            {trans.type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semi-bold text-p">
                            Rs. {(trans.amount || 0).toLocaleString()}
                          </span>
                          <div className="text-small text-grey">
                          {trans.creditAmount || 0} Credit(s)
                          </div>
                        </td>
                        {/* <td className="p-3">{trans.method || 'N/A'}</td> */}
                        <td className="p-3">
                        {trans.createdAt 
                              ? new Date(trans.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : 'N/A'
                        }
                        </td>
                        <td className="p-3">
                          <StatusBadge status={trans.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-small text-grey">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-light-grey text-grey rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>{pagination.page}</span>
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="px-4 py-2 bg-light-grey text-grey rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              {transactions.length === 0 && (
                <div className="text-center py-8 text-grey">
                  No transactions found
                </div>
              )}
            </>
          )}
    </div>
    </div>
        {selectedTransaction && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-h3 font-semibold">Transaction Details</h2>
            <button onClick={() => setSelectedTransaction(null)} className="text-grey">
              ✖
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {selectedTransaction.transactionId}</p>
            <p><strong>User:</strong> {selectedTransaction.sender?.username || 'N/A'}</p>
            <p><strong>Amount:</strong> Rs. {selectedTransaction.amount}</p>
            <p><strong>Credits:</strong> {selectedTransaction.creditAmount}</p>
            <p><strong>Status:</strong> <StatusBadge status={selectedTransaction.status} /></p>
            <p><strong>Type:</strong> {selectedTransaction.type}</p>
            <p><strong>Created At:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
            {selectedTransaction.remarks && <p><strong>Remarks:</strong> {selectedTransaction.remarks}</p>}
            {selectedTransaction.phoneNumber && <p><strong>Phone:</strong> {selectedTransaction.phoneNumber}</p>}
          </div>

          {selectedTransaction.type === 'khalti-cashout' && selectedTransaction.status === 'pending' && (
            <div className="mt-4 flex gap-2 justify-end">
              <button 
                onClick={() => handleUpdateStatus(selectedTransaction._id, 'completed')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Mark as Completed
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedTransaction._id, 'rejected')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </div>
)
}

export default AdminTransaction