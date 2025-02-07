import React from 'react'
import logo from "../assets/logo.png"
import profile from "../assets/profile.png"

function Navbar() {
  return (
        <div className=" flex justify-between p-2 px-28 ">
        <div className="flex gap-36 items-center">
        <img className="w-24 h-24 py-4"  src={logo} alt="logo"></img>
          <p className="font-poppins font-regular" >Home</p>
          <p className="font-poppins font-regular">Explore</p>
          </div>
          <div className="flex gap-8 justify-center items-center">
          <search className="bg-white text-dark-grey border rounded-md  h-10 w-64  " > Search..... </search>
          <img className="w-16 h-16 py-4" src={profile} alt="profile"></img>
          </div>
    </div>
  )
}

export default Navbar