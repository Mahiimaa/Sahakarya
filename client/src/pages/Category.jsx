import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png"
import {useState, useEffect} from 'react'
import axios from 'axios'

function Category() {
    const [addServiceForm, setAddServiceForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    
    useEffect(() => {
      fetchCategories();
  }, []);

  const fetchCategories = async () => {
      try {
          const response = await axios.get(`${apiUrl}/api/category`);
          setCategories(response.data.categories);
      } catch (error) {
          setError('Error fetching categories');
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await axios.post(`${apiUrl}/api/admin/category`,  {categoryName} );
          setSuccess('Category added successfully');
          setCategoryName('');
          setAddServiceForm(false);
          fetchCategories();
      } catch (error) {
          setError(error.response?.data?.message || 'Error adding category');
      }
  };

  const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this category?')) {
          try {
              const response = await axios.delete(`${apiUrl}/api/admin/category/${id}`);
              console.log('delete response : ', response.data)
              setSuccess('Category deleted successfully');
              fetchCategories();
          } catch (error) {
              setError('Error deleting category');
          }
      }
  };

  const toggleModal = () => {
      setAddServiceForm(!addServiceForm);
      setError('');
      setSuccess('');
      setCategoryName('');
  };

    return (
        <div className ="flex gap-4">
           <Navbar/>
           <div className="flex flex-col gap-4">
           <Topbar/>
           <div className="bg-screen p-4  border-none rounded-2xl">
           <div className="flex justify-between items-center ">
                   <h1 className="font-bold text-h1"> Category Management</h1> 
                   <button className='bg-p text-white font-poppins border rounded-md p-2 mr-4' onClick={toggleModal}> Add Category </button>
                   </div>

                   {error && <div className="bg-white text-error pt-2">{error}</div>}
                   {success && <div className="bg-white text-s pt-2">{success}</div>}

                   <div className="p-4 bg-white rounded-lg shadow mt-4">
                     <table className="w-full text-gray-700 border-collapse">
                       <thead>
                         <tr className="bg-gray-200">
                           <th className="px-4 py-2 border">Category Name</th>
                           <th className="px-4 py-2 border">Action</th>
                         </tr>
                       </thead>
                       <tbody>
                       {categories.map((category) => (
                         <tr key={category._id}>
                           <td className="px-4 py-2 border ">{category.categoryName}</td>
                           <td className="px-4 py-2 border text-center">
                             <button className="text-error  px-2 py-1 border-error border rounded hover:bg-error hover:text-white"
                             onClick={() => handleDelete(category._id)}
                             >Delete</button>
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
                         <h2 className="text-h2 font-bold mb-4">Add Category</h2>
                         <img  className="h-6 w-6" type="button" onClick={toggleModal} src ={close} />
                         </div>
                         <form onSubmit={handleSubmit}>
                           <div className="mb-4">
                             <label className="block font-bold mb-2">Category Name</label>
                             <input
                               type="text"
                               className="w-full p-2 border rounded"
                               placeholder="Enter Category name"
                               value={categoryName}
                               onChange={(e) => setCategoryName(e.target.value)}
                               required
                             />
                           </div>
                           <div className="flex justify-end">
                             <button
                               type="submit"
                               className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                             >
                               Add Category
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

export default Category