import React from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.post('/api/logout'); 
      alert(response.data.message);  

      navigate('/', {
        state: { message: "You have been logged out successfully." },
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong!');
    }
  };
  return (
    <div className ="flex flex-col justify-center items-center">
       {/* <Navbar/> */}
      <div className="text-p font-bold">
       This is User Home Page. Welcome!
      </div>
      <button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"> Log out </button>
    </div>
  )
}

export default Home