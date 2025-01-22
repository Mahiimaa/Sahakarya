import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
function AdminService() {
  return (
    <div className ="flex ">
       <Navbar/>
       <div className="flex flex-col">
       <Topbar/>
       <div className="">
        
       </div>
       </div>
       </div>
  )
}
export default AdminService