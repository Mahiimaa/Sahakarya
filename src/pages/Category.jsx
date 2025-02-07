import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png"
import {useState} from 'react'

function Category() {
    const [addServiceForm, setAddServiceForm] = useState(false);
    
      const toggleModal = () => {
        setAddServiceForm(!addServiceForm);
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
                   <div className="p-4 bg-white rounded-lg shadow mt-4">
                     <table className="w-full text-gray-700 border-collapse">
                       <thead>
                         <tr className="bg-gray-200">
                           <th className="px-4 py-2 border">Category ID</th>
                           <th className="px-4 py-2 border">Category Name</th>
                           <th className="px-4 py-2 border">Action</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr>
                           <td className="px-4 py-2 border">1</td>
                           <td className="px-4 py-2 border">Example Service</td>
                           <td className="px-4 py-2 border text-center">
                             <button className="text-error  px-2 py-1 border-error border rounded hover:bg-error hover:text-white">Delete</button>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
           
                   {addServiceForm && (
                     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                       <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                       <div className="flex justify-between items-center">
                         <h2 className="text-h2 text-grey font-bold mb-4">Add Category</h2>
                         <img  className="h-6 w-6" type="button" onClick={toggleModal} src ={close} />
                         </div>
                         <form>
                           <div className="mb-4">
                             <label className="block text-grey font-bold mb-2">Category Name</label>
                             <input
                               type="text"
                               className="w-full p-2 border rounded"
                               placeholder="Enter Category name"
                             />
                           </div>
                           <div className="flex justify-end">
                             <button
                               type="submit"
                               className="bg-p text-white px-4 py-2 rounded hover:bg-blue-600"
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