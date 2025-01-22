import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";

function Users() {
  return (
    <div className ="flex ">
       <Navbar/>
       <div className="flex flex-col">
       <Topbar/>
       </div>
       </div>
  )
}

export default Users