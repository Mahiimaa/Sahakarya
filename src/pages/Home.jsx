import React from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from 'react-router-dom';
import userhome from "../assets/userhome.png"
import axios from 'axios';
import explore from "../assets/explore.png"

function Home() {
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
    <div className ="flex flex-col">
       <Navbar/>
       <div className=" flex flex-col">
       
      <div className=" flex px-56 justify-between">
        <div className="flex flex-col gap-8">
        <p className= " font-poppins text-[40px] font-bold py-8" >Welcome Back, <br/> Mahima! </p>
        <div className="bg-[#CFF0E7] w-96 h-24 text-dark-grey border-none rounded-md ml-40 font-poppins font-bold flex justify-center items-center">
          Service 1
        </div>
        <div className="bg-[#FFECDF] w-96 h-24 text-dark-grey border-none rounded-md font-poppins font-bold flex justify-center items-center">
          Service 2
        </div>
        <div className="bg-[#FFE0E7]  w-96 h-24 text-dark-grey border-none rounded-md ml-40 font-poppins font-bold flex justify-center items-center">
          Service 3
        </div>
        </div>
        <div className="">
        <img className="w-[500px] h-[500px] self-center" src={userhome} alt="userhome"></img>
        <div className="bg-p w-[500px] h-20 rounded-lg text-white font-poppins font-semi-bold flex justify-between px-4 items-center"> Explore
        <img className="w-12 h-12 self-center" src={explore} alt="userhome"></img>
        </div>
        <button onClick={handleLogout} className="bg-p text-white p-2 border rounded-md"> Log Out </button>
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Home