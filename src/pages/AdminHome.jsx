import React from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    <div className ="flex flex-col justify-center items-center">
       {/* <Navbar/> */}
      <div className="text-p font-bold">
       This is Admin Home Page. Welcome!
      </div>
  <button onClick={handleLogout} className="bg-p text-white p-2 border rounded-md"> Log Out </button>
    </div>
  )
}

export default AdminHome