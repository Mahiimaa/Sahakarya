import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import user from "../assets/user.png"
import service from "../assets/services.png"
import transaction from "../assets/transaction.png"
function AdminHome() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    stats: true,
    monthly: true,
    services: true,
    transactions: true
  });

  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const token = localStorage.getItem('token');

  useEffect(() =>{
    fetchStats();
    fetchMonthlyData();
    fetchServiceDistribution();
    fetchRecentTransactions();
  }, []);

  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await axios.get(`${apiUrl}/api/stats` , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data.totalUsers);
      setServices(response.data.totalServices);
      setTransactions(response.data.totalTransactions);
    } catch (error) {
      setError("Error fetching stats");
    }
    finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }

  const fetchMonthlyData = async () => {
    setLoading(prev => ({ ...prev, monthly: true }));
    try {
      const response = await axios.get(`${apiUrl}/api/monthly-trends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMonthlyData(response.data);
    } catch (error) {
      setError("Error fetching monthly data");
      console.error("Error fetching monthly data:", error);
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  }

  const fetchServiceDistribution = async () => {
    setLoading(prev => ({ ...prev, services: true }));
    try {
      const response = await axios.get(`${apiUrl}/api/service-categories` , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setServiceDistribution(response.data);
    } catch (error) {
      setError("Error fetching service distribution");
      console.error("Error fetching service distribution:", error);
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  }

  const fetchRecentTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const response = await axios.get(`${apiUrl}/api/recent-transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRecentTransactions(response.data);
    } catch (error) {
      setError("Error fetching recent transactions");
      console.error("Error fetching recent transactions:", error);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

  const statusColors = {
    'Completed': '#4CAF50',
    'Pending': '#FFC107',
    'Cancelled': '#F44336',
    'Processing': '#2196F3'
  };


  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
        <h1 className="font-bold text-h1"> Overview</h1>
      <div className=" flex flex-col gap-4 mt-4">
        <div className="flex justify-around py-10 bg-white border-none rounded-2xl ">
          <div className="flex flex-col justify-center items-center">
          <img src={user} className='h-10 w-10'/>
          <p>{users}</p>
        <p> Total no. of Users</p>
        </div>
        <div className="flex flex-col justify-center items-center">
        <img src={service} className='h-10 w-10'/>
        <p>{services}</p>
        <p> Total no. of Services</p>
        </div>
        <div className="flex flex-col justify-center items-center">
        <img src={transaction} className='h-10 w-10'/>
        <p>{transactions}</p>
        <p> Total no. of Transactions</p>
        </div>
       </div>
       <div className="flex gap-4">
       <div className="h-[61vh] w-1/2 border-none rounded-2xl bg-white">
       <h2 className="font-semi-bold text-h3 m-4">Monthly Trend Analysis</h2>
                {loading.monthly ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="services" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="transactions" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                )}        
       </div>
       <div className=" flex flex-col gap-4">
       <div className="h-[61vh] w-[45vw] border-none rounded-2xl bg-white">
       {loading.services ? (
                    <div className="flex justify-center items-center ">
                      <p>Loading chart data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="85%">
                      <PieChart>
                        <Pie
                          data={serviceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="category"
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {serviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.category]} />
                        <Legend formatter={(value, entry) => entry.payload.category} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
       </div>
       {/* <div className="h-1/2 w-[45vw] border-none  rounded-2xl bg-white">
       {loading.transactions ? (
                    <div className="flex justify-center items-center h-4/5">
                      <p>Loading transaction data...</p>
                    </div>
                  ) : (
                    <div className="overflow-auto h-[22vh]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.serviceName}</td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">${transaction.amount}</td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</td>
                              <td className="px-6 py-2 whitespace-nowrap">
                                <span
                                  className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                  style={{ backgroundColor: statusColors[transaction.status] || '#9e9e9e', color: 'white' }}
                                >
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
       </div> */}
       </div>
       </div>
      </div>
    </div>
    </div>
    </div>
  )
}

export default AdminHome