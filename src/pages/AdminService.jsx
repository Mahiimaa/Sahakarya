import React from 'react'
import { useState } from 'react';
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import close from "../assets/close.png";

function AdminService() {
  const [addServiceForm, setAddServiceForm] = useState(false);

  const toggleModal = () => {
    setAddServiceForm(!addServiceForm);
  };
  return (
    <div className ="flex ">
       <Navbar/>
       <div className="flex flex-col">
       <Topbar/>
       <div className="flex justify-between items-center ">
        <h1 className="font-bold text-h1 text-grey"> Service Management</h1> 
        <button className='bg-p text-white font-poppins border rounded-md p-2 mr-4' onClick={toggleModal}> Add Service </button>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <table className="w-full text-gray-700 border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Service ID</th>
                <th className="px-4 py-2 border">Service Name</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Category</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border">1</td>
                <td className="px-4 py-2 border">Example Service</td>
                <td className="px-4 py-2 border">This is an example description.</td>
                <td className="px-4 py-2 border">Category A</td>
                <td className="px-4 py-2 border">Active</td>
                <td className="px-4 py-2 border text-center">
                  <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {addServiceForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">Add Service</h2>
              <img  className="h-6 w-6" onClick={toggleModal} src ={close} />
              </div>
              <form>
                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">Service Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Enter service name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Enter description"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">Category</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Enter category"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-p text-white px-4 py-2 rounded hover:bg-blue-600"
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
  )
}
export default AdminService