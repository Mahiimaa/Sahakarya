import React, {useState, useEffect} from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from 'react-router-dom';
import userhome from "../assets/userhome.png"
import axios from 'axios';
import explore from "../assets/explore.png"

function Home() {
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          navigate('/login'); 
          return;
        }
        const response = await axios.get(`${apiUrl}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUserDetails(response.data);
        console.log(response.data);
      } catch (err) {
        setError('Failed to load user details.');
      }
    };

    fetchUserDetails();
  }, [apiUrl, navigate]);

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

  const toExplore = () => {
    navigate('/explore');
  }
  return (
    <div className ="flex flex-col">
       <Navbar/>
       <div className=" flex flex-col ">
      <div className=" flex px-56 justify-between items-center">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col">
        <p className= " font-poppins text-[40px] font-bold " >Welcome Back,</p> 
          <p className='font-poppins text-[40px] font-bold text-s'>{userDetails ? userDetails.name : 'Loading...'}</p>
          </div>
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
        <div className="flex flex-col pt-8">
        <img className="w-[500px] h-[500px] self-center" src={userhome} alt="userhome"></img>
        <div className="bg-p w-[500px] h-20 rounded-lg text-white font-poppins font-semi-bold text-h2 flex justify-between px-4 items-center" onClick={toExplore}> Explore
        <img className="w-12 h-12 self-center" src={explore} alt="userhome"></img>
        <button className="bg-p text-white " onClick ={handleLogout}>  Logout </button>
        </div>
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Home