import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";

const UserProfileInfoPage = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
          console.log('Token:', token);
          if (!token) {
            navigate('/login'); 
            return;
          }
        const response = await axios.get(`${apiUrl}/api/user/me`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
        });
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching user information:", err);
        setError("Failed to load user information.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [ apiUrl]);

  const openEditProfile = () => {
    navigate('/editProfile');
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen p-6 flex flex-col ">
     <div className="flex justify-start">
    <button className="bg-p text-white rounded py-2 px-4">
      <NavLink to="/home" className="flex items-center">
        <svg
          className="w-5 h-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </NavLink>
    </button>
  </div>
  <div className="flex-grow flex items-center justify-center">
      <div className="min-w-screen mx-auto bg-white shadow-lg rounded-lg p-6 ">
      <p className="flex justify-self-center text-p text-h2 font-semi-bold p-4"> User Profile </p>
        {/* Profile Picture */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-gray-300">
            <img
              src={user.profilePicture || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-poppins text-s font-semi-bold mt-4">{user.username}</h1>
        </div>

        {/* Personal Information */}
        <div className="border-t border-grey pt-4">
          <h2 className="text-h2 font-bold mb-3">Personal Information</h2>
          <div className="flex flex-col gap-3">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone || "Not provided"}
          </p>
          <p>
            <strong>Address:</strong> {user.address || "Not provided"}
          </p>
          </div>
        </div>

        {/* Services Offered */}
        <div className="border-t border-grey pt-4 mt-6">
          <h2 className="text-h2 font-bold mb-3">Services Offered</h2>
          {user.services && user.services.length > 0 ? (
            <ul className="list-disc list-inside">
              {user.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          ) : (
            <p>No services offered yet.</p>
          )}
        </div>
        <button className="bg-p p-2 text-white border rounded-md flex justify-self-center m-3" onClick ={openEditProfile} >Edit Profile</button>
      </div>
    </div>
    </div>
  );
};

export default UserProfileInfoPage;
