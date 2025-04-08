import React from 'react'
import { useState, useEffect } from 'react';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png";
import axios from "axios";
import { toast } from "react-toastify";

function AdminService() {
  const [addServiceForm, setAddServiceForm] = useState(false);
  const [editServiceForm, setEditServiceForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    serviceName: '',
    category: ''
  });
  const [editService, setEditService] = useState({
    _id: '',
    serviceName: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [searchTerm, setSearchTerm] = useState('');

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/category`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories);
    } catch (error) {
      setError('Error fetching categories');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    console.log(newService);
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/api/admin/service`, newService, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response);
      setSuccess('Service added successfully');
      setNewService({ serviceName: '', category: '' });
      setAddServiceForm(false);
      fetchServices();
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding service');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${apiUrl}/api/admin/service/${editService._id}`, {
        serviceName: editService.serviceName,
        category: editService.category
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Service updated successfully');
      setEditServiceForm(false);
      fetchServices();
      toast.success("Service updated successfully");
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating service');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`${apiUrl}/api/admin/service/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const toggleEditModal = (service = null) => {
    if (service) {
      setEditService({
        _id: service._id,
        serviceName: service.serviceName,
        category: service.category?._id || ''
      });
      setEditServiceForm(true);
    } else {
      setEditServiceForm(false);
      setEditService({ _id: '', serviceName: '', category: '' });
    }
    setError('');
    setSuccess('');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredServices = services.filter(service => 
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.category?.categoryName && 
     service.category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
       <div className="flex justify-between items-center ">
        <h1 className="font-semi-bold text-h1"> Service Management</h1> 
        <div className="flex justify-end w-2/3 gap-2">
             <input
               type="text"
               placeholder="Search services or categories..."
               className="p-2 border rounded-md w-full md:w-1/3"
               value={searchTerm}
               onChange={handleSearch}
             />
        <button className='bg-p hover:bg-p/90 text-white font-poppins border rounded-md p-2 mr-4' onClick={toggleModal}> Add Service </button>
        </div>
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
              {currentServices.map((service)=>(
              <tr key={service._id}>
                <td className="px-4 py-2 border">{service.serviceName}</td>
                <td className="px-4 py-2 border">{service.category?.categoryName}</td>
                <td className="px-4 py-2 border text-center">
                <div className="flex justify-center gap-2">
                <button 
                  className="text-blue-600 px-2 py-1 border-blue-600 border rounded hover:bg-blue-600 hover:text-white"
                  onClick={() => toggleEditModal(service)}
                  >
                  Edit
                  </button>
                  <button className="bg-white text-error px-2 py-1 rounded border border-error hover:bg-error hover:text-white"
                  onClick={() => handleDeleteService(service._id)}>Delete</button>
                  </div>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
             <div className="flex justify-center mt-4">
               <nav className="flex items-center">
                 <button 
                   onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                   disabled={currentPage === 1}
                   className={`mx-1 px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-p text-white hover:bg-p/90'}`}
                 >
                   Prev
                 </button>
                 
                 <div className="flex mx-1">
                   {[...Array(totalPages).keys()].map(number => (
                     <button
                       key={number + 1}
                       onClick={() => paginate(number + 1)}
                       className={`mx-1 px-3 py-1 rounded ${currentPage === number + 1 ? 'bg-p text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                     >
                       {number + 1}
                     </button>
                   ))}
                 </div>
                 
                 <button 
                   onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                   disabled={currentPage === totalPages}
                   className={`mx-1 px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-p text-white hover:bg-p/90'}`}
                 >
                   Next
                 </button>
               </nav>
             </div>
           )}
           {currentServices.length === 0 && (
             <div className="text-center py-4 text-gray-500">
               {searchTerm ? 'No services match your search' : 'No services found'}
             </div>
           )}
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
        {editServiceForm && (
           <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
             <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
               <div className="flex justify-between items-center">
                 <h2 className="text-h2 font-bold mb-4">Edit Service</h2>
                 <img className="h-6 w-6 cursor-pointer" onClick={() => toggleEditModal()} src={close || "/placeholder.svg"} alt="Close" />
               </div>
               <form onSubmit={handleEditSubmit}>
                 <div className="mb-4">
                   <label className="block font-bold mb-2">Service Name</label>
                   <input
                     type="text"
                     name="serviceName"
                     className="w-full p-2 border rounded"
                     placeholder="Enter service name"
                     value={editService.serviceName}
                     onChange={handleEditInputChange}
                     required
                   />
                 </div>
                 <div className="mb-4">
                   <label className="block font-bold mb-2">Category</label>
                   <select
                     name="category"
                     className="w-full p-2 border rounded"
                     value={editService.category}
                     onChange={handleEditInputChange}
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
                     className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                   >
                     Update Service
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