import React from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";

function Transactions() {
  return (
    <div className ="flex gap-4">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
        <h1 className="font-bold text-h1 ">Transactions</h1>

       </div>
       </div>
       </div>
  )
}

export default Transactions