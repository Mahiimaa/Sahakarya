import React from 'react'
import logo from "../assets/logo.png"
import dashboard from "../assets/dashboard.png"
import user from "../assets/user.png"
import service from "../assets/services.png"
import transaction from "../assets/transaction.png"
import category from "../assets/category.png"
import settings from "../assets/settings.png"
import { NavLink, useNavigate, useLocation } from "react-router-dom";


function AdminNav() {
    const navigate = useNavigate();
  
    const setActiveClass = ({ isActive }) =>
    {
      return `flex items-center gap-6 pr-6 transition-all duration-200 ease-in-out ${isActive ? "bg-white text-p rounded-lg border border-p" : "hover:bg-p hover:rounded-lg"}`;
    }

    return (
        <div className="flex flex-col h-[100vh] justify-between items-center ">
          <div className="flex flex-col left-0 self-start justify-center items-center pl-8 gap-6">
            <img className="w-24 h-20 mt-4" src={logo} alt="" />
            <div className="flex flex-col gap-4">
                <NavLink to="/adminhome" className={setActiveClass}>
                <div className="flex  items-center gap-6 p-2">
                  <img className="w-8 h-8" src={dashboard} alt="" />
                  <p className='font-poppins font-regular'>Dashboard</p>
                  </div>
                </NavLink>
            
                <NavLink to="/users" className={setActiveClass}>
                <div className="flex items-center gap-6 p-2">
                  <img className="w-8 h-8"  src={user}  alt="" />
                  <p className='font-poppins font-regular '>Users</p>
                  </div>
                </NavLink>
            
                <NavLink to="/services" className={setActiveClass}>
                <div className="flex items-center gap-6 p-2">
                  <img  className="w-8 h-8"  src={service} alt="" />
                  <p className='font-poppins font-regular'> Services</p>
                  </div>
                </NavLink>
              
                <NavLink to="/transactions" className={setActiveClass}>
                <div className="flex items-center gap-6 p-2">
                  <img className="w-8 h-8"  src={transaction}  alt="" />
                  <p className='font-poppins font-regular'>Transactions</p>
                  </div>
                </NavLink>
             
        
                <NavLink to="/category" className={setActiveClass}>
                <div className='flex items-center gap-6 p-2'>
                  <img className="w-8 h-8"  src={category} alt="" />
                  <p className='font-poppins font-regular'>Category</p>
                  </div>
                </NavLink>
            </div>
            </div>

                <div className="flex flex-col left-0 self-start justify-center items-center pl-8">
                <NavLink to="/adminsettings"  className={setActiveClass}>
                <div className='flex items-center gap-6 p-2'>
                  <img src={settings} className="w-8 h-8" alt="" />
                  <p className='font-poppins font-regular '> Settings</p>
                  </div>
                </NavLink>
        </div>
        </div>
      );
    };

export default AdminNav