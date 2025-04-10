import React from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminTop() {
    const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
    await axios.post(`${apiUrl}/api/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn("Logout error:", error.response?.data?.message || error.message);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { state: { message: "You have successfully logged out!" } });
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