import React, {useState, useEffect} from 'react'
import Navbar from "../components/Navbar"
import { useNavigate } from 'react-router-dom';
import userhome from "../assets/userhome.png"
import axios from 'axios';
import { toast } from "react-toastify";
import { Star, CheckCircle, Search, ArrowRight, LogOut, Calendar, Clock } from 'lucide-react';
import explore from "../assets/explore.png";

function Home() {
  const [userDetails, setUserDetails] = useState(null);
  const [topRatedUsers, setTopRatedUsers] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!token) {
        console.warn("Token missing. Skipping user fetch.");
        return;
      }
      try {
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
  }, [apiUrl]);

    const fetchTopRatedUsers = async () => {
      if (!token) {
        console.warn("Token missing. Skipping top-rated fetch.");
        return;
      }    
      try {
        const response = await axios.get(`${apiUrl}/api/providers/top-rated`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
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
      if (!token) {
        console.warn("No token, skipping popular services fetch.");
        return;
      }
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

    useEffect(() => {
      const fetchRecentBookings = async () => {
        if (!token) {
          console.warn("Token missing. Skipping recent bookings fetch.");
          return;
        }
        try {
          const response = await axios.get(`${apiUrl}/api/bookings/requester`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          const sortedBookings = response.data.sort((a, b) => 
            new Date(b.dateRequested) - new Date(a.dateRequested)
          );
          
          const recent = sortedBookings.slice(0, 3);
          
          console.log('Recent Bookings:', {
            count: recent.length,
            bookings: recent
          });

          setRecentBookings(recent);
        } catch (err) {
          console.error('Recent Bookings Fetch Error:', {
            errorMessage: err.message,
            errorResponse: err.response?.data,
            errorStatus: err.response?.status,
          });

          if (err.response) {
            const errorMessage = err.response.data?.error || 'Failed to fetch recent bookings';
            setError(errorMessage);
          } else if (err.request) {
            setError('No response from server');
          } else {
            setError('Error preparing request');
          }

          setRecentBookings([]);
        }
      };
      fetchRecentBookings()
    },[apiUrl, token, navigate])


    const handleLogout = async () => {
      try {
        await axios.post(`${apiUrl}/api/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn("Logout error:", error.response?.data?.message);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { state: { message: "You have successfully logged out!" } });
      }
    };    

  const toExplore = () => {
    navigate('/explore');
  }

  const getProfileImage = (profilePicture) => {
    return profilePicture || "/api/placeholder/64/64";
  };

  const getStatusColorClass = (status) => {
    switch(status) {
      case "pending": return "text-s";
      case "scheduled": return "text-p";
      case "completed": return "text-p";
      case "credit transferred": return "text-p";
      case "awaiting requester confirmation": return "text-s";
      case "disputed": return "text-error";
      case "rejected": return "text-error";
      default: return "text-grey";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewBookingDetails = () => {
    navigate('/request' );
  };
  
  return (
    <div className ="flex flex-col font-poppins">
       <Navbar/>
      <div className="px-4 md:px-6 py-8 flex flex-col">
        <div className="flex justify-center items-center">
          <div className="bg-p/50 text-black w-full md:w-3/4 rounded-lg p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="font-poppins text-2xl font-bold mb-2">Ready to get started?</h2>
              <p className="max-w-md">Explore to find the perfect service provider for your needs.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-white text-p py-2 px-6 rounded-md font-semibold border border-p hover:bg-p hover:text-white whitespace-nowrap" onClick={toExplore}>Explore Now</button>
              <button className="bg-white border hover:bg-p hover:text-white border-p text-p py-2 px-6 rounded-md font-semibold" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mb-12 gap-4 mt-8 px-2">
          <div className="flex flex-col gap-4 items-center w-full md:w-3/4 text-center">
            <h1 className="font-poppins text-h1 font-bold">Welcome Back,</h1>
            <h2 className="font-poppins text-h1 font-bold text-p">{userDetails ? userDetails.username : 'Loading...'}</h2>

            <div className="relative w-full md:w-2/4">
              <input
                type="text"
                placeholder="What service do you need today?"
                className="w-full py-3 px-12 rounded-full border border-dark-grey shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!searchTerm.trim()) return;
              
                    const match = popularServices.find((s) =>
                      s.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
                    );
              
                    if (match) {
                      navigate(`/services/${match._id}`);
                    } else {
                      toast.error("No matching service found.");
                    }
                  }
                }}
              />
              <Search className="absolute left-4 top-3.5 text-grey" size={20} />
              <button className="absolute right-3 top-2 bg-p text-white py-1 px-4 rounded-full"
              onClick={() => {
                if (!searchTerm.trim()) return;
            
                const match = popularServices.find((s) =>
                  s.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
                );
            
                if (match) {
                  navigate(`/services/${match._id}`);
                } else {
                  toast.error("No matching service found.");
                }
              }}
              >Search</button>
            </div>
          </div>

          <div className="relative flex flex-col md:flex-row justify-center items-center w-full md:w-3/4 rounded-3xl bg-light-grey mt-8">
            <div className="bg-white m-4 rounded-lg p-4 w-full md:w-1/2">
              <p className="text-h2 font-bold py-6">How it works?</p>
              <p className="text-h3 font-poppins py-2">~ Explore the services you want</p>
              <p className="text-h3 font-poppins py-2">~ View the task details</p>
              <p className="text-h3 font-poppins py-2">~ See if the provider is the right fit</p>
              <p className="text-h3 font-poppins py-2">~ Request service</p>
              <p className="text-h3 font-poppins py-2">~ Set schedule</p>
              <p className="text-h3 font-poppins py-2">~ Confirm task completion</p>
            </div>
            <img className="w-full md:w-1/2 h-auto object-contain p-4" src={userhome} alt="Service illustration" />
          </div>
        </div>
      </div>
      <div className="px-4 md:px-6 py-8 w-full md:w-3/4 self-center">
        <div className="flex justify-between mb-6">
          <h2 className="font-poppins text-2xl font-bold">Popular Services</h2>
          <button className="flex items-center gap-2 text-p font-semi-bold" onClick={toExplore}>
            View All <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {popularServices.map((service) => (
            <div key={service.id} className="p-4 rounded-2xl shadow-md duration-200 cursor-pointer border border-light-grey hover:-translate-y-1.5 transition-transform" 
            onClick={() => navigate(`/services/${service._id}`)}>
              <div className="flex items-center gap-4">
                {/* <span className="text-3xl">{service.icon}</span> */}
                <h3 className="font-poppins font-semi-bold text-lg">{service.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Providers */}
      <div className="px-4 md:px-12 lg:px-24 py-8 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-poppins text-2xl font-bold">Top Rated Providers</h2>
          <button className="flex items-center gap-2 text-p font-semi-bold" onClick={toExplore}>View All →</button>
        </div>
        {topRatedUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topRatedUsers.map((user) => (
              <div key={user._id} className="bg-white p-6 rounded-lg border border-light-grey shadow-sm hover:shadow-lg transition-shadow hover:-translate-y-1.5 duration-200">
                <div className="flex flex-col items-center text-center">
                  <img src={getProfileImage(user.profilePicture)} alt={`${user.username}'s avatar`} className="w-16 h-16 rounded-full mb-4 object-cover" />
                  <h3 className="font-poppins font-semibold text-lg mb-1">{user.username}</h3>
                  <p className="text-gray-600 mb-2">{user.category || "Service Provider"}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="text-[yellow]" />
                    <span className="font-medium">{user.rating ? user.rating.toFixed(1) : "New"}</span>
                    <span className="text-grey text-sm">({user.completedJobs || 0} {user.completedJobs === 1 ? "task" : "tasks"})</span>
                  </div>
                  <button className="mt-2 w-full py-2 px-4 rounded-md bg-p text-white font-medium hover:bg-opacity-90 transition-colors" onClick={() => navigate(`/provider-details/${user._id}`)}>
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

      {/* Recent Bookings */}
      <div className="px-4 md:px-12 lg:px-24 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-poppins text-2xl font-bold">Your Recent Bookings</h2>
          <button className="text-p font-semibold" onClick={viewBookingDetails}>See All</button>
        </div>
        {recentBookings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="bg-white p-6 rounded-lg shadow-sm border border-light-grey hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-poppins font-semi-bold text-body">{booking?.service?.serviceName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(booking.status)}`}>{booking.status}</span>
                </div>
                <p className="text-grey mb-4">Provider: {booking?.provider?.username}</p>
                <div className="flex flex-col gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className='text-p' />
                    <span>Requested: {formatDate(booking.dateRequested)}</span>
                  </div>
                  {booking.scheduleDate && (
                    <div className="flex items-center gap-1">
                      <Clock size={16} className='text-p' />
                      <span>Scheduled: {formatDate(booking.scheduleDate)}</span>
                    </div>
                  )}
                </div>
                {booking.status === "awaiting requester confirmation" && (
                  <div className="mt-2 p-2 bg-s/10 rounded-md text-sm">
                    <p><strong>Duration:</strong> {booking.actualDuration} hour(s)</p>
                    <p><strong>Credits:</strong> {booking.proposedCredits}</p>
                    {booking.completionNotes && <p className="truncate"><strong>Notes:</strong> {booking.completionNotes}</p>}
                  </div>
                )}
                <div className="flex justify-end mt-auto items-end">
                  <button className="bg-white text-p border border-p hover:bg-p hover:text-white px-4 py-2 rounded-md" onClick={viewBookingDetails}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <p className="text-grey">You don't have any recent bookings.</p>
            <button onClick={toExplore} className="mt-4 py-2 px-6 bg-p text-white rounded-md font-semi-bold">
              Explore Services
            </button>
          </div>
        )}
      </div>
 </div>
  )
}

export default Home