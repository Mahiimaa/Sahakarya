import React, { useImperativeHandle, forwardRef } from "react";
import axios from "axios";

const Khalti = forwardRef((props, ref) => {
    const khaltiPublicKey = process.env.REACT_APP_KHALTI_PUBLIC_KEY || "test-key";
    const config = {
    publicKey: khaltiPublicKey,
    productIdentity: "time-credit-001",
    productName: "Time Credits Purchase",
    productUrl: window.location.href,
    paymentPreference: ["KHALTI"],
    eventHandler: {
      onSuccess(payload) {
        console.log("Payment Successful", payload);
        axios
          .post(`${process.env.REACT_APP_API_BASE_URL}/api/verify`, {
            token: payload.token,
            amount: 1000 
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          .then(response => {
            console.log("Backend Verification Successful", response.data);
          })
          .catch(error => {
            console.error("Backend Verification Error", error.response ? error.response.data : error.message);
          });
      },
      onError(error) {
        console.error("Payment Error", error);
      },
      onClose() {
        console.log("Khalti widget closed");
      },
    },
  };

  const handlePayment = () => {
    let checkout = new window.KhaltiCheckout(config);
    checkout.show({ amount: 1000 }); 
  };

  useImperativeHandle(ref, () => ({
    handlePayment,
  }));

  return null;
});

export default Khalti;
