import React, {useEffect, useState} from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import axios from "axios";

function Users() {
  const [users, setUsers]= useState([]);
  const [error, setError]= useState(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() =>{
    const fetchUsers = async() =>{
      try {
        const response = await axios.get(`${apiUrl}/api/users`);
        setUsers(response.data.users);
      } catch (error) {
        setError("Error fetching users");
      }
    }
    fetchUsers();
  }, [apiUrl]);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${apiUrl}/api/deleteUser/${id}`);
      setUsers(users.filter((user) => user._id !== id)); 
    } catch (err) {
      setError('Error deleting user');
    }
  };
  
  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4 border-none rounded-2xl">
       <div className="flex justify-between items-center ">
                   <h1 className="font-bold text-h1"> User Management</h1> 
                   </div>
                   <div className="p-4 bg-white rounded-lg shadow mt-4">
                    {error && <div className=" text-error p-2 rounded">{error}</div>}
                     <table className="w-full text-gray-700 border-collapse">
                       <thead>
                         <tr className="bg-gray-200">
                           <th className="px-4 py-2 border">User Email</th>
                           <th className="px-4 py-2 border">User Name</th>
                           <th className="px-4 py-2 border">Action</th>
                         </tr>
                       </thead>
                       <tbody>
                        {users.map((user) => (
                         <tr key={user._id}>
                           <td className="px-4 py-2 border">{user.email}</td>
                           <td className="px-4 py-2 border">{user.username}</td>
                           <td className="px-4 py-2 border text-center">
                             <button className="text-error px-2 py-1 border-error border rounded hover:bg-error hover:text-white"
                             onClick={() => deleteUser(user._id)}
                             >Delete</button>
                           </td>
                         </tr>
                        ))}
                       </tbody>
                     </table>
                   </div>
       </div>
       </div>
       </div>
  )
}

export default Users