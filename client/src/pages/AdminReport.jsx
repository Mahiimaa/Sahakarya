import React from 'react'
import { useState, useEffect } from 'react';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import axios from 'axios';
import { toast } from 'react-toastify';
import { AlertTriangle } from 'lucide-react';

function AdminReport() {
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('token');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingWarningId, setSendingWarningId] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningUserId, setWarningUserId] = useState('');
    const [warningMessage, setWarningMessage] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
        const { data } = await axios.get(`${apiUrl}/api/getreports`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setReports(data);
        console.log(data);
        } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports');
        } finally {
        setLoading(false);
        }
    };

  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
       <h1 className="text-h1 font-semi-bold mb-6">Reports</h1>
       {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Service/Request</th>
                    <th className="py-2 px-4 border-b text-left">User</th>
                    <th className="py-2 px-4 border-b text-left">Reported By</th>
                    <th className="py-2 px-4 border-b text-left">Description</th>
                    <th className="py-2 px-4 border-b text-left">Status</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const isReporterRequester = report.reportedBy?._id === report.bookingId?.requester?._id;
                    const otherUser = isReporterRequester
                      ? report.bookingId?.provider?.username
                      : report.bookingId?.requester?.username;

                    return (
                    <tr key={report._id} className="hover:bg-light-grey/50">
                      <td className="py-2 px-4 border-b">
                        {report.bookingId?.service?.serviceName || 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {otherUser || 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {report.reportedBy?.username || 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b max-w-sm truncate">
                        {report.description}
                      </td>
                      <td className="py-2 px-4 border-b capitalize">
                        {report.status}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {report.status !== "warning_sent" ? (
                          <button
                            className="flex items-center gap-2 bg-error hover:bg-error/90 text-white px-4 py-2 rounded"
                            onClick={() => {
                              setWarningUserId(isReporterRequester ? report.bookingId?.provider?._id : report.bookingId?.requester?._id);
                              setShowWarningModal(true);
                              setWarningMessage('');
                            }}
                            >
                            {sendingWarningId === report.reportedBy?._id ? "Sending..." : (
                              <>
                                <AlertTriangle size={16} />
                                Send Warning
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-p font-semibold">Warning Sent</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {showWarningModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">Send Warning</h2>

                <label className="block font-semibold mb-2">Warning Message</label>
                <textarea
                    className="w-full border rounded-md p-2 mb-4"
                    placeholder="Type your warning message..."
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                    <button
                    className="bg-white text-error border border-error hover:bg-error hover:text-white px-4 py-2 rounded"
                    onClick={() => setShowWarningModal(false)}
                    >
                    Cancel
                    </button>
                    <button
                    className="bg-p text-white hover:bg-p/90 px-4 py-2 rounded"
                    onClick={async () => {
                        if (!warningMessage.trim()) {
                        toast.error('Please write a warning message.');
                        return;
                        }
                        try {
                        setSendingWarningId(warningUserId);
                        await axios.post(`${apiUrl}/api/send-warning`, {
                            userId: warningUserId,
                            message: warningMessage,
                        }, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        toast.success('Warning sent successfully!');
                        setShowWarningModal(false);
                        setWarningUserId('');
                        setWarningMessage('');
                        fetchReports(); 
                        } catch (error) {
                        console.error('Error sending warning:', error);
                        toast.error('Failed to send warning');
                        } finally {
                        setSendingWarningId(null);
                        }
                    }}
                    >
                    Send Warning
                    </button>
                </div>
                </div>
            </div>
            )}
       </div>
       </div>
       </div>
  )
}

export default AdminReport