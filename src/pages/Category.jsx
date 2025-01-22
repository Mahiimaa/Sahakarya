import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";

function Category() {
    return (
        <div className ="flex ">
           <Navbar/>
           <div className="flex flex-col">
           <Topbar/>
           </div>
           </div>
    )
}

export default Category