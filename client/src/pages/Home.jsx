import React, {useState, useEffect} from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from 'react-router-dom';
import userhome from "../assets/userhome.png"
import axios from 'axios';
import { Star, CheckCircle, Search, ArrowRight, LogOut } from 'lucide-react';
import explore from "../assets/explore.png";

function Home() {
  const [userDetails, setUserDetails] = useState(null);
  const [topRatedUsers, setTopRatedUsers] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
    
        console.log('Token:', token);
        // if (!token) {
        //   navigate('/login'); 
        //   return;
        // }
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



    const fetchTopRatedUsers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/providers/top-rated`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
    
        console.log('Top Providers Full Response:', {
          status: response.status,
          data: response.data
        });
    
        const topProviders = response.data?.topProviders || [];
        
        console.log('Processed Top Providers:', {
          count: topProviders.length,
          providers: topProviders
        });
    
        setTopRatedUsers(topProviders);
      } catch (err) {
        console.error('Top Providers Fetch Error:', {
          errorMessage: err.message,
          errorResponse: err.response?.data,
          errorStatus: err.response?.status,
          fullError: err
        });
    
        // Error handling
        if (err.response) {
          const errorMessage = err.response.data?.error || 'Failed to fetch top providers';
          setError(errorMessage);
          console.error('Server Error Details:', err.response.data);
        } else if (err.request) {
          setError('No response from server');
        } else {
          setError('Error preparing request');
        }
    
        setTopRatedUsers([]);
      }
    };
    
    // Fetch Popular Services
    const fetchPopularServices = async () => {
      try {
        console.log('Fetching Popular Services', {
          url: `${apiUrl}/api/services/popular`,
          token: token ? 'Token Present' : 'No Token'
        });
    
        const response = await axios.get(`${apiUrl}/api/services/popular`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
    
        console.log('Full Popular Services Response:', {
          status: response.status,
          data: response.data
        });
    
        const popularServices = response.data?.popularServices || [];
        
        console.log('Processed Popular Services:', {
          count: popularServices.length,
          services: popularServices
        });
    
        setPopularServices(popularServices);
      } catch (err) {
        console.error('Detailed Popular Services Fetch Error:', {
          errorMessage: err.message,
          errorResponse: err.response?.data,
          errorStatus: err.response?.status,
          fullError: err
        });
    
        // Comprehensive error handling
        if (err.response) {
          const errorMessage = err.response.data?.error || 'Failed to fetch popular services';
          setError(errorMessage);
          console.error('Server Error Details:', err.response.data);
        } else if (err.request) {
          setError('No response from server');
        } else {
          setError('Error preparing request');
        }
    
        setPopularServices([]);
      }
    };

    useEffect(() => {
    fetchTopRatedUsers();
  fetchPopularServices();
}, [apiUrl, token, navigate]);

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

  const getProfileImage = (profilePicture) => {
    return profilePicture || "/api/placeholder/64/64";
  };
  return (
    <div className ="flex flex-col">
       <Navbar/>
       <div className="px-6 py-8 flex flex-col ">
        <div className="px-6  flex justify-center items-center">
        <div className="bg-light-grey text-black w-3/4 hover:bg-dark-grey hover:text-white rounded-lg p-6 flex justify-between items-center">
          <div>
            <h2 className="font-poppins text-2xl font-bold mb-2">Ready to get started?</h2>
            <p className="max-w-md">Explore to find the perfect service provider for your needs.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="bg-white text-p py-2 px-6 rounded-md font-semibold border border-p hover:bg-p hover:text-white"
              onClick={toExplore}
            >
              Explore Now
            </button>
            <button 
              className="bg-white border border-p text-p py-2 px-6 rounded-md font-semibold"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
        <div className="flex flex-col items-center mb-12 gap-4">
          <div className="flex flex-col gap-4 items-center w-3/4">
            <h1 className="font-poppins text-h1 font-bold ">Welcome Back,</h1>
            <h2 className="font-poppins text-h1 font-bold text-p">
              {userDetails ? userDetails.username : 'Loading...'}
            </h2>
            {/* Search Bar */}
            <div className="relative w-2/4">
              <input
                type="text"
                placeholder="What service do you need today?"
                className="w-full py-3 px-12 rounded-full border border-dark-grey shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 text-grey" size={20} />
              <button className="absolute right-3 top-2 bg-p text-white py-1 px-4 rounded-full">
                Search
              </button>
            </div>
          </div>
          
          <div className=" relative flex justify-center items-center w-2/4 h-3/4 rounded-3xl bg-light-grey">
          <div className="bg-white absolute left-12  rounded-lg p-4 h-3/4  ">
            <p className='text-h2 font-bold py-6'>How it works?</p>
            <p className='text-h3 font-poppins py-4'>~ Explore the services you want</p>
            <p className='text-h3 font-poppins py-4'>~ View the task details</p>
            <p className='text-h3 font-poppins py-4'>~ See if the provider is the right fit for you</p>
            <p className='text-h3 font-poppins py-4'>~ Request service</p>
            <p className='text-h3 font-poppins py-4'>~ Set schedule</p>
            <p className='text-h3 font-poppins py-4'>~ Confirm task completion</p>
            </div>
            <img className="w-3/4 h-3/4 object-contain ml-auto" src={userhome} alt="Service illustration" />  
          </div>
        </div>
        
      </div>
      
      {/* Popular Services */}
      <div className="px-6 py-8 w-2/4 flex flex-col self-center ">
        <div className="flex justify-between mb-6">
          <h2 className="font-poppins text-2xl font-bold">Popular Services</h2>
          <button 
            className="flex items-center gap-2 text-p font-semibold"
            onClick={toExplore}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="flex justify-between gap-6">
          {popularServices.map((service) => (
            <div 
              key={service.id}
              className="p-4 rounded-2xl shadow-2xl hover:shadow-s transition-shadow duration-200 cursor-pointer border border-light-grey"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{service.icon}</span>
                <h3 className="font-poppins font-semibold text-lg">{service.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Rated Providers */}
      <div className="px-6 md:px-12 lg:px-24 py-8 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-poppins text-2xl font-bold">Top Rated Providers</h2>
          <button 
            className="flex items-center gap-2 text-p font-semibold"
            onClick={toExplore}
          >
            View All →
          </button>
        </div>
        
        {topRatedUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRatedUsers.map((user) => (
              <div 
                key={user._id}
                className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={getProfileImage(user.profilePicture)} 
                    alt={`${user.username}'s avatar`}
                    className="w-16 h-16 rounded-full mb-4 object-cover"
                  />
                  <h3 className="font-poppins font-semibold text-lg mb-1">{user.username}</h3>
                  <p className="text-gray-600 mb-2">{user.category || "Service Provider"}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium">{user.rating ? user.rating.toFixed(1) : "New"}</span>
                    <span className="text-gray-500 text-sm">
                      ({user.completedJobs || 0} {user.completedJobs === 1 ? "task" : "tasks"})
                    </span>
                  </div>
                  <button 
                    className="mt-2 w-full py-2 px-4 rounded-md bg-p text-white font-medium hover:bg-opacity-90 transition-colors"
                    onClick={() => navigate(`/provider/${user._id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-dark-grey text-center">
            <p className="text-s mb-4">No top-rated providers available yet.</p>
            <p className="text-grey">Be the first to offer your services!</p>
          </div>
        )}
      </div>
      
      {/* Recent Bookings Section */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-poppins text-2xl font-bold">Your Recent Bookings</h2>
          <button className="text-p font-semibold">See All</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any recent bookings.</p>
            <button 
              onClick={toExplore}
              className="mt-4 py-2 px-6 bg-p text-white rounded-md font-semibold"
            >
              Explore Services
            </button>
          </div>
        </div>
      </div>
    </div>
    
  )
}

export default Home