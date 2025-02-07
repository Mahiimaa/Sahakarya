import React, { useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_BASE_URL

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/verify/${token}`);
        alert(response.data.message);
        navigate("/");
      } catch (error) {
        alert(error.response?.data?.message || "Verification failed");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex flex-col justify-center items-center mt-20">
      <h2>Verifying your email...</h2>
    </div>
  );
}

export default Verify;
