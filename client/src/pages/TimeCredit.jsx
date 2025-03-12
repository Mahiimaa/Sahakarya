import React, {useState, useRef, useEffect} from 'react'
import Khalti from "../components/Khalti"

function TimeCredit() {
    const khaltiRef = useRef(null);
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-grey">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h1 className="text-s text-xl font-bold ">My Time Credits</h1>
        <div className="p-4 bg-gray-200 rounded-lg">
          <h2 className="text-lg font-semi-bold text-grey">Time Credit Balance: <span className="text-blue-600">50</span></h2>
          <p className="text-grey mt-2">Time Credit Status: <span className="font-medium text-green-600">Active</span></p>
        </div>
        <div className="flex flex-col justify-between">
        <details className="relative">
        <summary className=" list-none cursor-pointer flex justify-self-center "> 
          <p className="flex text-h3 text-p border border-p bg-white rounded-md p-1 px-24 hover:bg-p hover:text-white">Buy Time Credits</p>
        </summary>
        <ul className="absolute bg-white border rounded p-4 left-[50%] w-fit top-10 ">
        <p className="text-h2 font-semi-bold whitespace-nowrap pb-4"> Available Payment Options</p>
        <button className=" bg-p text-white px-4 py-2 rounded-lg" onClick={() => {
                  if (khaltiRef.current) {
                    khaltiRef.current.handlePayment();
                  }
                }}>
        Pay with Khalti
        </button>
        </ul>
        </details>
        </div>
      </div>
      <Khalti ref={khaltiRef} />
    </div>
  )
}

export default TimeCredit