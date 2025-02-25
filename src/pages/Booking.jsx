import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

function Booking() {
  const { serviceId, providerId } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    duration: "1 hour",
  });

  const handleBooking = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/bookService`,
        { serviceId, providerId, ...bookingDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat/${providerId}`);
    } catch (error) {
      console.error("Error booking service:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="flex justify-center items-center">
        <div className="flex flex-col border rounded-md p-6 justify-center items-center">
      <h1 className="text-h2 font-bold ">Confirm Your Booking</h1>
      <label className="block mt-4 font-semi-bold">Date:</label>
      <input
        type="date"
        className="border p-2 w-full"
        value={bookingDetails.date}
        onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
      />
      <label className="block mt-4 font-semi-bold">Duration:</label>
      <select
        className="border p-2 w-full"
        value={bookingDetails.duration}
        onChange={(e) => setBookingDetails({ ...bookingDetails, duration: e.target.value })}
      >
        <option>1 hour</option>
        <option>2 hours</option>
        <option>Half Day</option>
        <option>Full Day</option>
      </select>
      <div className=" flex justify-center items-center">
      <button className="bg-p text-white px-4 py-2 rounded mt-4" onClick={handleBooking}>
        Confirm & Proceed to Chat
      </button>
      </div>
    </div>
    </div>
    </div>
  );
}

export default Booking;