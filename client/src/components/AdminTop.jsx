import React from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminTop() {
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
    <div className="bg-white w-[88vw] h-20 flex justify-between items-center font-poppins">
        <p className="text-h1 text-s"> Welcome, Admin!</p>
        <button className="text-p bg-white p-2 px-6 mr-4 border-p border-2 rounded-md" onClick={handleLogout}> Logout</button>
    </div>
  )
}

export default AdminTop