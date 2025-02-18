import React, {useEffect, useState} from 'react'
import Navbar from "../components/Navbar"
import Chat from '../components/Chat';
import axios from "axios"

function Explore() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]); 
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/services`);
        setServices(data.services);
        setFilteredServices(data.services);
        const uniqueCategories = ['All', ...new Set(data.services.map(service => service.category.categoryName))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, [apiUrl]);

  useEffect(() => {
    let filtered = services.filter(service =>
      (selectedCategory === 'All' || service.category.categoryName === selectedCategory) &&
      service.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [selectedCategory, searchQuery, services]);

  return (
    <div className = "flex flex-col">
        <Navbar />
        <div className="flex p-4 mx-28">
        <div className="w-1/6 p-4 bg-dark-grey rounded-lg">
          <h2 className="text-lg font-semi-bold mb-4">Categories</h2>
          {categories.map(category => (
            <button
              key={category}
              className={`flex w-full p-2 my-1 text-left rounded-lg ${
                selectedCategory === category ? 'bg-p text-white' : 'bg-white'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="w-full px-4">
          <div className="flex justify-between mb-4">
            <input 
              type="text" 
              placeholder="Search services..." 
              className="p-2 w-full border rounded-lg"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <h2 className="text-h2 font-semi-bold mb-2">Featured Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <div key={service._id} className="p-4 border rounded-lg shadow-lg bg-white">
                  <h3 className="font-bold text-lg">{service.serviceName}</h3>
                  <p className="text-dark-grey">{service.category.categoryName}</p>
                  <button 
                    className="mt-2 bg-p text-white p-2 rounded-lg w-full"
                    onClick={() => { setChatOpen(true); setSelectedService(service); }}
                  >
                    Chat with Provider
                  </button>
                </div>
              ))
            ) : (
              <p className="text-dark-grey">No services found.</p>
            )}
          </div>
        </div>
      </div>
      {chatOpen && <Chat service={selectedService} onClose={() => setChatOpen(false)} />}
    </div>

  )
}

export default Explore