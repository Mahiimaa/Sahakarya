import React, { useEffect, useState } from 'react'
import axios from 'axios';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import user from "../assets/user.png"
import service from "../assets/services.png"
import transaction from "../assets/transaction.png"
function AdminHome() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL

  useEffect(() =>{
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/stats`);
      setUsers(response.data.totalUsers);
      setServices(response.data.totalServices);
      setTransactions(response.data.totalTransactions);
    } catch (error) {
      setError("Error fetching stats");
    }
  }

  return (
    <div className ="flex gap-4">
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

       </div>
       <div className=" flex flex-col gap-4">
       <div className=" h-1/2 w-[45vw] border-none rounded-2xl bg-white">
       </div>
       <div className="h-1/2 w-[45vw] border-none  rounded-2xl bg-white">
       </div>
       </div>
       </div>
      </div>
    </div>
    </div>
    </div>
  )
}

export default AdminHome