import React, {useState} from 'react'

function TimeCredit() {
    const [transferForm, setTransferForm] = useState(false);
    const [recipient, setrecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    const handleTransfer = async () => {
        if (!recipient || !amount || !password) {
          setMessage("All fields are required.");
          return;
        }
    
        try {
          const response = await fetch("http://localhost:5000/api/transferCredit", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipient, amount, password }),
          });
    
          const data = await response.json();
          if (response.ok) {
            setMessage("Time Credit transferred successfully!");
          } else {
            setMessage(data.message || "Transfer failed. Try again.");
          }
        } catch (error) {
          setMessage("Error connecting to server.");
        }
      };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-grey">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h1 className="text-s text-xl font-bold mb-4">My Time Credits</h1>
        <div className="p-4 bg-gray-200 rounded-lg">
          <h2 className="text-lg font-semi-bold text-grey">Time Credit Balance: <span className="text-blue-600">50</span></h2>
          <p className="text-grey mt-2">Time Credit Status: <span className="font-medium text-green-600">Active</span></p>
        </div>
        <div className="flex justify-between">
        <button className="mt-4 bg-p text-white py-2 px-4 rounded-lg shadow-md transition">
          Buy Time Credit
        </button>
        <button onClick={() => setTransferForm(true)}
        className="mt-4 bg-p text-white py-2 px-4 rounded-lg shadow-md transition">
          Transfer Time Credit
        </button>
        </div>
      </div>
      {transferForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 ">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/4 text-center h-3/8 justify-between items-center">
            <h2 className="text-h2 font-bold mb-4 ">Transfer Time Credit</h2>
            <div className=" flex flex-col gap-4">
            <input
              type="text"
              placeholder="Recipient email or username"
              value={recipient}
              onChange={(e) => setrecipient(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="password"
              placeholder="Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            </div>
            {message && <p className="text-error text-regular">{message}</p>}
            <div className="flex justify-between">
              <button 
                className="bg-s text-white py-2 px-4 rounded-lg"
                onClick={() => setTransferForm(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-p text-white py-2 px-4 rounded-lg"
                onClick={handleTransfer}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeCredit