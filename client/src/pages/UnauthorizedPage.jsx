import React from 'react';

const Unauthorized = () => (
  <div className="h-screen flex items-center justify-center font-poppins text-center">
    <div>
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
    </div>
  </div>
);

export default Unauthorized;
