import React from 'react'
import { useState, useEffect } from 'react';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png";
import axios from "axios";


function AdminService() {
  const [addServiceForm, setAddServiceForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    serviceName: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/category`);
      setCategories(response.data.categories);
    } catch (error) {
      setError('Error fetching categories');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/services`);
      setServices(response.data.services);
    } catch (error) {
      setError('Error fetching services');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    console.log(newService);
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/api/admin/service`, newService);
      console.log(response);
      setSuccess('Service added successfully');
      setNewService({ serviceName: '', category: '' });
      setAddServiceForm(false);
      fetchServices();
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding service');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`${apiUrl}/api/admin/service/${id}`);
        setSuccess('Service deleted successfully');
        fetchServices();
      } catch (error) {
        setError('Error deleting service');
      }
    }
  };

  const toggleModal = () => {
    setAddServiceForm(!addServiceForm);
    setError('');
    setSuccess('');
    setNewService({ serviceName: '', category: '' });
  };
  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
       <div className="flex justify-between items-center ">
        <h1 className="font-bold text-h1"> Service Management</h1> 
        <button className='bg-p hover:bg-p/90 text-white font-poppins border rounded-md p-2 mr-4' onClick={toggleModal}> Add Service </button>
        </div>
        {error && <div className=" text-error p-2 rounded">{error}</div>}
        {success && <div className=" text-s p-2 rounded">{success}</div>}
        <div className="p-4 bg-white rounded-lg shadow mt-4">
          <table className="w-full text-gray-700 border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Service Name</th>
                <th className="px-4 py-2 border">Category</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service)=>(
              <tr key={service._id}>
                <td className="px-4 py-2 border">{service.serviceName}</td>
                <td className="px-4 py-2 border">{service.category?.categoryName}</td>
                <td className="px-4 py-2 border text-center">
                  <button className="bg-white text-error px-2 py-1 rounded border border-error hover:bg-error hover:text-white"
                  onClick={() => handleDeleteService(service._id)}>Delete</button>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>

        {addServiceForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <div className="flex justify-between items-center">
              <h2 className="text-h2 font-bold mb-4">Add Service</h2>
              <img  className="h-6 w-6" onClick={toggleModal} src ={close} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block  font-bold mb-2">Service Name</label>
                  <input
                    type="text"
                    name="serviceName"
                    className="w-full p-2 border rounded"
                    placeholder="Enter service name"
                    value={newService.serviceName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-bold mb-2">Category</label>
                  <select
                      name="category"
                      className="w-full p-2 border rounded"
                      value={newService.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a Category</option>
                      {categories.map((category) => (
                        <option 
                          key={category._id} 
                          value={category._id}
                        >
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
       </div>
       </div>
  )
}
export default AdminService