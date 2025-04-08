import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png"
import {useState, useEffect} from 'react'
import axios from 'axios'
import { toast } from "react-toastify";

function Category() {
    const [addServiceForm, setAddServiceForm] = useState(false);
    const [editServiceForm, setEditServiceForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem("token");
    
    useEffect(() => {
      fetchCategories();
    }, [searchTerm, currentPage]);

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

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await axios.post(`${apiUrl}/api/admin/category`,  {categoryName}, {
            headers: { Authorization: `Bearer ${token}` },
          } );
          setSuccess('Category added successfully');
          setCategoryName('');
          setAddServiceForm(false);
          fetchCategories();
      } catch (error) {
          setError(error.response?.data?.message || 'Error adding category');
      }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
        await axios.put(`${apiUrl}/api/admin/category/${editCategoryId}`, {
            categoryName: editCategoryName
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Category updated successfully');
        setEditCategoryName('');
        setEditCategoryId(null);
        setEditServiceForm(false);
        fetchCategories();
        toast.success("category updated successfully");
    } catch (error) {
        setError(error.response?.data?.message || 'Error updating category');
    }
};

  const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this category?')) {
          try {
              const response = await axios.delete(`${apiUrl}/api/admin/category/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
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

  const toggleEditModal = (category = null) => {
    if (category) {
        setEditCategoryId(category._id);
        setEditCategoryName(category.categoryName);
        setEditServiceForm(true);
    } else {
        setEditServiceForm(false);
        setEditCategoryId(null);
        setEditCategoryName('');
    }
    setError('');
    setSuccess('');
};

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const filteredCategories = categories.filter(category => 
        category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);


    return (
        <div className ="flex gap-4 font-poppins">
           <Navbar/>
           <div className="flex flex-col gap-4">
           <Topbar/>
           <div className="bg-screen p-4  border-none rounded-2xl">
           <div className="flex justify-between items-center ">
                   <h1 className="font-bold text-h1"> Category Management</h1>
                   <div className="flex justify-end w-2/3 gap-2">
                   <input
                       type="text"
                       placeholder="Search categories..."
                       className="p-2 border rounded-md w-full md:w-1/3 "
                       value={searchTerm}
                       onChange={handleSearch}
                      />
                   <button className='bg-p text-white font-poppins border rounded-md p-2 mr-4' onClick={toggleModal}> Add Category </button>
                   </div>
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
                       {currentCategories.map((category) => (
                         <tr key={category._id}>
                           <td className="px-4 py-2 border ">{category.categoryName}</td>
                           <td className="px-4 py-2 border text-center">
                           <div className="flex justify-center gap-2">
                           <button 
                             className="text-blue-600 px-2 py-1 border-blue-600 border rounded hover:bg-blue-600 hover:text-white"
                             onClick={() => toggleEditModal(category)}
                           >
                             Edit
                           </button>
                             <button className="text-error  px-2 py-1 border-error border rounded hover:bg-error hover:text-white"
                             onClick={() => handleDelete(category._id)}
                             >Delete</button>
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
                 
                 {/* No results message */}
                 {currentCategories.length === 0 && (
                   <div className="text-center py-4 text-gray-500">
                     {searchTerm ? 'No categories match your search' : 'No categories found'}
                   </div>
                 )}
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
                   {editServiceForm && (
                 <div className="fixed inset-0 flex items-center justify-center bg-dark-grey bg-opacity-50 z-50">
                   <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                     <div className="flex justify-between items-center">
                       <h2 className="text-h2 font-bold mb-4">Edit Category</h2>
                       <img className="h-4 w-4 cursor-pointer" type="button" onClick={() => toggleEditModal()} src={close || "/placeholder.svg"} alt="Close" />
                     </div>
                     <form onSubmit={handleEditSubmit}>
                       <div className="mb-4">
                         <label className="block font-bold mb-2">Category Name</label>
                         <input
                           type="text"
                           className="w-full p-2 border rounded"
                           placeholder="Enter Category name"
                           value={editCategoryName}
                           onChange={(e) => setEditCategoryName(e.target.value)}
                           required
                         />
                       </div>
                       <div className="flex justify-end">
                         <button
                           type="submit"
                           className="bg-p hover:bg-p/90 text-white px-4 py-2 rounded"
                         >
                           Update Category
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