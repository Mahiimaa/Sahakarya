import React from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import user from "../assets/user.png"
import service from "../assets/services.png"
import transaction from "../assets/transaction.png"
function AdminHome() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/api/logout`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate('/', { state: { message: 'You have successfully logged out!' } });
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong!');
    }
  };
  return (
    <div className ="flex ">
       <Navbar/>
       <div className="flex flex-col">
       <Topbar/>
      <div className=" flex flex-col gap-4 mt-4">
       <div className="border-light-grey border-2 rounded-lg">
        <div className="flex justify-around py-10">
          <div className="flex flex-col justify-center items-center">
          <img src={user} className='h-10 w-10'/>
          <p>44</p>
        <p> Total no. of Users</p>
        </div>
        <div className="flex flex-col justify-center items-center">
        <img src={service} className='h-10 w-10'/>
        <p>44</p>
        <p> Total no. of Services</p>
        </div>
        <div className="flex flex-col justify-center items-center">
        <img src={transaction} className='h-10 w-10'/>
        <p>44</p>
        <p> Total no. of Transactions</p>
        </div>
        </div>
       </div>
       <div className="flex ">
       <div className="border-dark-grey border-2 rounded-md">second

       </div>
       <div className=" flex flex-col">
       <div className="border-dark-grey border-2 rounded-md">third

       </div>
       <div className="border-dark-grey border-2 rounded-md">fourth

       </div>
       </div>
       </div>
      </div>
    </div>
    </div>
  )
}

export default AdminHome