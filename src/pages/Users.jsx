import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";

function Users() {
  return (
    <div className ="flex gap-4">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-t p-4 border-none rounded-2xl">
       <div className="flex justify-between items-center ">
                   <h1 className="font-bold text-h1"> User Management</h1> 
                   </div>
                   <div className="p-4 bg-white rounded-lg shadow mt-4">
                     <table className="w-full text-gray-700 border-collapse">
                       <thead>
                         <tr className="bg-gray-200">
                           <th className="px-4 py-2 border">User ID</th>
                           <th className="px-4 py-2 border">User Name</th>
                           <th className="px-4 py-2 border">Action</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr>
                           <td className="px-4 py-2 border">1</td>
                           <td className="px-4 py-2 border">Example User</td>
                           <td className="px-4 py-2 border text-center">
                             <button className="text-error px-2 py-1 border-error border rounded hover:bg-error hover:text-white">Delete</button>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
       </div>
       </div>
       </div>
  )
}

export default Users