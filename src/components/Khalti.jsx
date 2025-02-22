import React from "react";
import axios from "axios";

const KhaltiCheckoutComponent = () => {
  const config = {
    // Replace with your Khalti public key
    publicKey: "your_public_key_here",
    productIdentity: "time-credit-001",
    productName: "Time Credits Purchase",
    productUrl: window.location.href,
    paymentPreference: ["KHALTI"],
    eventHandler: {
      onSuccess(payload) {
        console.log("Payment Successful", payload);
        // Call the backend to verify payment.
        axios
          .post(`${process.env.REACT_APP_API_BASE_URL}/api/credits/verify`, {
            token: payload.token,
            amount: 1000 // Amount in paisa (adjust as needed)
          })
          .then(response => {
            console.log("Backend Verification Successful", response.data);
            // Optionally update UI/state with new time credits.
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
    checkout.show({ amount: 1000 }); // amount in paisa
  };

  return (
    <div className="text-center">
    </div>
  );
};

export default KhaltiCheckoutComponent;
