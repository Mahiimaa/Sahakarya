import React, { useImperativeHandle, forwardRef, useEffect, useState } from "react";
import axios from "axios";
import {toast} from "react-toastify";

const Khalti = forwardRef((props, ref) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const khaltiPublicKey = process.env.REACT_APP_KHALTI_PUBLIC_KEY;
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!document.getElementById('khalti-script')) {
      const script = document.createElement('script');
      script.id = 'khalti-script';
      script.src = "https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.22.0.0.0/khalti-checkout.iffe.js";
      script.async = true;
      script.onload = () => {
        console.log("Khalti script loaded successfully");
        setIsScriptLoaded(true);
      };
      script.onerror = (error) => {
        console.error("Failed to load Khalti script:", error);
      };
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
      toast.error("Payment system is still loading. Please try again in a moment.");
      return;
    }
    
    if (!khaltiPublicKey) {
      console.error("Khalti Public Key is missing! Make sure REACT_APP_KHALTI_PUBLIC_KEY is set in your environment.");
      toast.error("Payment configuration error. Please contact support.");
      return;
    }

    console.log("Using Khalti Public Key:", khaltiPublicKey);
    console.log("Processing amount:", amount);
    
    const config = {
      publicKey: "b010be2aa27e4f9fa49d9656c30ea718",
      productIdentity: "time-credit-001",
      productName: "Time Credits Purchase",
      productUrl: "http://localhost:3000",
      amount: amount,
      paymentPreference: ["KHALTI"],
      eventHandler: {
        onSuccess(payload) {
          console.log("Payment Successful", payload);
          toast.info("Payment successful! Verifying...");
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
              toast.success("Credits purchased successfully!");
              if (props.onSuccess) props.onSuccess(response.data);
              window.location.reload();
            })
            .catch(error => {
              console.error("Backend Verification Error", error.response ? error.response.data : error.message);
              toast.error("Verification failed. Please contact support.");
              if (props.onError) props.onError(error);
            });
        },
        onError(error) {
          console.error("Payment Error", error);
          toast.error("Payment failed. Please try again.");
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
      checkout.show({ amount: amount });
    } catch (err) {
      console.error("Failed to initialize Khalti checkout:", err);
      toast.error("Failed to initialize payment. Please try again.");
    }
  };

  useImperativeHandle(ref, () => ({
    handlePayment,
  }));

  return null;
});

export default Khalti;