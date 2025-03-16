import React, { useImperativeHandle, forwardRef, useEffect, useState } from "react";
import axios from "axios";

const Khalti = forwardRef((props, ref) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const khaltiPublicKey = process.env.REACT_APP_KHALTI_PUBLIC_KEY || "15ef4852257b4064aa8bb38077ea7cf1";
  
  useEffect(() => {
    if (!document.getElementById('khalti-script')) {
      const script = document.createElement('script');
      script.id = 'khalti-script';
      // KHALTI_ENDPOINT='https://dev.khalti.com/api/v2'
      script.src = "https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.22.0.0.0/khalti-checkout.iffe.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);
      
      return () => {
        if (document.getElementById('khalti-script')) {
          document.getElementById('khalti-script').remove();
        }
      };
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  const handlePayment = (amount) => {
    if (!isScriptLoaded) {
      console.error("Khalti script is still loading, please try again.");
      return;
    }
    
    if (!khaltiPublicKey) {
      console.error("Khalti Public Key is missing! Make sure REACT_APP_KHALTI_PUBLIC_KEY is set in your environment.");
      return;
    }

    console.log("Using Khalti Public Key:", khaltiPublicKey);
    console.log("Amount Sent:", 1000);
    
    const config = {
      publicKey: khaltiPublicKey,
      productIdentity: "time-credit-001",
      productName: "Time Credits Purchase",
      productUrl: window.location.href,
      amount: amount,
      paymentPreference: ["KHALTI"],
      eventHandler: {
        onSuccess(payload) {
          console.log("Payment Successful", payload);
          const apiUrl = process.env.REACT_APP_API_BASE_URL;
          axios
            .post(`${apiUrl}/api/verify`, {
              token: payload.token,
              amount: amount,
            }, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            .then(response => {
              console.log("Backend Verification Successful", response.data);
              if (props.onSuccess) props.onSuccess(response.data);
              // You might want to refresh the time credits display here
              window.location.reload();
            })
            .catch(error => {
              console.error("Backend Verification Error", error.response ? error.response.data : error.message);
              if (props.onError) props.onError(error);
            });
        },
        onError(error) {
          console.error("Payment Error", error);
          if (props.onError) props.onError(error);
        },
        onClose() {
          console.log("Khalti widget closed");
          if (props.onClose) props.onClose();
        },
      },
    };

    try {
      const checkout = new window.KhaltiCheckout(config);
      checkout.show({ amount: 1000 });
    } catch (err) {
      console.error("Failed to initialize Khalti checkout:", err);
    }
  };

  useImperativeHandle(ref, () => ({
    handlePayment,
  }));

  return null;
});

export default Khalti;