const axios = require("axios");
require("dotenv").config();

const KHALTI_BASE_URL = process.env.KHALTI_GATEWAY_URL || "https://a.khalti.com";

async function verifyKhaltiPayment(pidx) {
  if (!pidx) {
    throw new Error("pidx is required for verifying Khalti payment.");
  }
  
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
  
  const bodyContent = JSON.stringify({ pidx });
  
  const reqOptions = {
    url: `${KHALTI_BASE_URL}/api/v2/epayment/lookup/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };
  
  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error verifying Khalti payment:", error.response?.data || error);
    throw error;
  }
}
async function initializeKhaltiPayment(details) {
  if (!details || !details.amount) {
    throw new Error("Invalid payment details provided.");
  }
  
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
  
  const bodyContent = JSON.stringify(details);
  
  console.log("Sending Khalti request to:", `${KHALTI_BASE_URL}/api/v2/epayment/initiate/`);
  console.log("With headers:", headersList);
  console.log("With body:", bodyContent);

  const reqOptions = {
    url: `${KHALTI_BASE_URL}/api/v2/epayment/initiate/`, 
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };
  
  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error initializing Khalti payment:", 
      error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : error.message);
    throw error;
  }
}

async function initiateKhaltiPayout(payoutDetails) {
  if (!payoutDetails || !payoutDetails.amount || !payoutDetails.phone) {
    throw new Error("Invalid payout details. Amount and phone are required.");
  }

  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_DISBURSEMENT_KEY || process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
  
  const bodyContent = JSON.stringify(payoutDetails);
  
  console.log("Sending Khalti payout request to:", `${KHALTI_BASE_URL}/api/v2/disbursement/payout/`);
  console.log("With headers:", headersList);
  console.log("With body:", bodyContent);

  const reqOptions = {
    url: `${KHALTI_BASE_URL}/api/v2/disbursement/payout/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };
  
  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error initiating Khalti payout:", 
      error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : error.message);
    throw error;
  }
}

async function checkKhaltiPayoutStatus(token) {
  if (!token) {
    throw new Error("Token is required for checking payout status.");
  }
  
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_DISBURSEMENT_KEY || process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
  
  const reqOptions = {
    url: `${KHALTI_BASE_URL}/api/v2/disbursement/payout/status/${token}/`, // This endpoint might be different
    method: "GET",
    headers: headersList
  };
  
  try {
    const response = await axios.request(reqOptions);
    return response.data;
  } catch (error) {
    console.error("Error checking Khalti payout status:", error.response?.data || error);
    throw error;
  }
}

module.exports =  { verifyKhaltiPayment, initializeKhaltiPayment, initiateKhaltiPayout,
  checkKhaltiPayoutStatus };