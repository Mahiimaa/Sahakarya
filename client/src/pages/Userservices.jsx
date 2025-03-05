import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { IoTrash, IoPencil, IoClose } from "react-icons/io5";

function UserServices() {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [userServices, setUserServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceImage, setServiceImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    const fetchUserServices = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/my-services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserServices(response.data.services);
      } catch (err) {
        console.error("Error fetching user services:", err);
        setError("Failed to load your services.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserServices();
  }, [apiUrl, token]);

  const handleEditClick = (service) => {
    setSelectedService(service);
    setServiceTitle(service.title || "");
    setServiceDescription(service.description || "");
    setPreviewImage(service.image ? `${apiUrl}${service.image}` : "");
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setServiceImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedService) return;

    try {
      const formData = new FormData();
      formData.append("title", serviceTitle);
      formData.append("description", serviceDescription);
      if (serviceImage) {
        formData.append("image", serviceImage);
      }

      await axios.put(`${apiUrl}/api/user/services/${selectedService.serviceId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      toast.success("Service updated successfully!");

      setUserServices((prevServices) =>
        prevServices.map((service) =>
          service.serviceId === selectedService.serviceId
            ? { ...service, title: serviceTitle, description: serviceDescription, image: previewImage }
            : service
        )
      );

      setShowModal(false);
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service.");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await axios.delete(`${apiUrl}/api/user/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserServices((prevServices) => prevServices.filter((service) => service.serviceId !== serviceId));
      toast.success("Service deleted successfully!");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service.");
    }
  };

  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="mx-28">
        <h1 className="text-h2 font-semi-bold mt-6">My Service Details</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : userServices.length === 0 ? (
          <p className="text-dark-grey mt-4">You have not added any service details.</p>
        ) : (
          <div className="grid grid-cols-4 gap-6 mt-4">
            {userServices.map((service) => (
              <div key={service.serviceId} className="p-4 border border-dark-grey rounded-lg bg-white shadow">
                {service.image ? (
                  <img
                    src={`${apiUrl}${service.image}`}
                    alt={service.title}
                    className="w-full h-40 rounded-md object-cover mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-grey flex items-center justify-center rounded-md mb-3">
                    <p className="text-dark-grey">No Image</p>
                  </div>
                )}

                <h3 className="font-semi-bold text-h3">{service.title}</h3>
                <p className="mt-2">{service.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex items-center gap-1 text-p bg-white border border-p px-3 py-1 rounded-md hover:bg-p hover:text-white"
                    onClick={() => handleEditClick(service)}
                  >
                    <IoPencil /> Edit
                  </button>
                  <button
                    className="flex items-center gap-1 text-error bg-white border border-error px-3 py-1 rounded-md hover:bg-error hover:text-white"
                    onClick={() => handleDeleteService(service.serviceId)}
                  >
                    <IoTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-dark-grey bg-opacity-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-md w-96 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2 font-semi-bold">Edit Service</h2>
              <button className="text-xl" onClick={() => setShowModal(false)}>
                <IoClose />
              </button>
            </div>

            <input
              className="w-full border rounded-md p-2 mb-2"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="Service Title"
            />
            <textarea
              className="w-full border rounded-md p-2"
              rows="4"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Describe your service..."
            ></textarea>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
            {previewImage && <img src={previewImage} alt="Service Preview" className="mt-2 w-full rounded-md" />}

            <div className="flex justify-end mt-4">
              <button className="bg-p text-white px-4 py-2 rounded-md" onClick={handleSaveChanges}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserServices;
