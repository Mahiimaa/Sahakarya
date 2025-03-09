import React, {useEffect, useState} from 'react'
import Navbar from "../components/Navbar";
import axios from "axios";

function Transactions() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
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
    };
    fetchTransactions();
  }, [apiUrl, token]);

  return (
    <div className ="flex flex-col">
       <Navbar/>
       <div className="max-w-4xl mx-auto p-6 shadow-md bg-white rounded-lg mt-6">
        <h1 className="text-h2 font-bold mb-4">Transaction History</h1>
        {error && <p className="text-error text-center">{error}</p>}
        {transactions.length > 0 ? (
          <table className="w-full border-collapse border border-dark-grey">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border border-dark-grey">Date</th>
                <th className="p-3 border border-dark-grey">Service Name</th>
                <th className="p-3 border border-dark-grey">Transferred To</th>
                <th className="p-3 border border-dark-grey">Time Credits</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="text-center">
                  <td className="p-3 border border-dark-grey">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 border border-dark-grey"> {transaction.bookingId?.service || "N/A"}</td>
                  <td className="border p-3 border-dark-grey">
                    {transaction.recipient?.username || "N/A"}
                  </td>
                  {/* <td
                    className={`p-3 border border-dark-grey font-bold ${
                      transaction.type === "service_payment" ? "text-error" : "text-green-600"
                    }`}
                  >
                    {transaction.type === "service_payment" ? "-" : "+"}
                    {transaction.amount} Credits
                  </td> */}
                  <td className="p-3 border border-dark-grey capitalize">{transaction.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-s text-gray-500 mt-4">
            No transactions found.
          </p>
        )}
      </div>
       </div>
  )
}

export default Transactions