import React, {  useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";
import ReactStars from "react-rating-stars-component";
import { IoClose } from "react-icons/io5";

function ProviderDetails() {
  const { providerId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get("serviceId");
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [fullImage, setFullImage] = useState(null);
  const [previousWork, setPreviousWork] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showModal, setShowModal] = useState(false);

  console.log("Extracted serviceId:", serviceId);
  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        console.log("Fetching provider details for ID:", providerId); 
        const { data } = await axios.get(`${apiUrl}/api/providers/${providerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched Provider Data:", data);
        if (!serviceId) {
          console.error("Service ID is missing in the URL. Cannot filter service details.");
        }
        console.log("Fetched Provider Data:", data);
        setProvider(data.provider);
        setReviews(data.reviews);
      } catch (error) {
        console.error("Error fetching provider details:", error);
      }
    };
    fetchProviderDetails();
  }, [providerId, apiUrl, serviceId]);

  useEffect(() => {
    const fetchPreviousWork = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/${providerId}/previous-work`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreviousWork(data.previousWork);
      } catch (error) {
        console.error("Error fetching previous work:", error);
      }
    };
    fetchPreviousWork();
  }, [providerId, apiUrl]);

  const handleReviewSubmit = async () => {
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide a rating and comment.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${apiUrl}/api/reviews`,
        { providerId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviews([...reviews, data.review]);
      setShowModal(false);
      setRating(0);
      setComment("");
      toast.success("Review submitted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error submitting review");
    }
  };

  const handleEditReview = async () => {
    if (!editingReview) return;

    try {
      const { data } = await axios.put(
        `${apiUrl}/api/reviews/${editingReview._id}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviews(reviews.map((r) => (r._id === editingReview._id ? data.review : r)));
      setEditingReview(null);
      setShowModal(false);
      setRating(0);
      setComment("");
      toast.success("Review updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating review");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`${apiUrl}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(reviews.filter((r) => r._id !== reviewId));
      toast.success("Review deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error deleting review");
    }
  };

  const handleImageClick = (imageUrl) => {
    setFullImage(imageUrl);
  };

  const closeModal = () => {
    setFullImage(null);
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  return (
    <div className="flex flex-col min-h-screen  ">
      <Navbar />
      {provider && (
        <div className="max-w-6xl mx-auto px-4 py-8 w-full bg-white shadow ">
          {/* Provider Header Card */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex  md:flex-row md:items-center gap-6">
              <div className="flex-shrink-0">
                <img 
                  src={provider.profilePicture ? `${apiUrl}${provider.profilePicture}` : "https://via.placeholder.com/150"} 
                  alt={`${provider.username}'s profile`} 
                  className="w-24 h-24 rounded-full object-cover shadow-lg"
                />
              </div>
              <div className="flex-grow">
                <h1 className="text-h2 font-bold">{provider.username}</h1>
                <p className="text-grey">{provider.email}</p>
                
                <div className="flex items-center mt-2">
                  <ReactStars 
                    value={calculateAverageRating()} 
                    edit={false} 
                    size={24} 
                    isHalf={true} 
                  />
                  <span className="ml-2 text-grey">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <button className="bg-p hover:bg-p/90 text-white font-semi-bold px-6 py-3 rounded-full shadow-md transition-colors">
                  Contact Provider
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg mb-6 overflow-hidden">
            <div className="flex ">
              <button 
                className={`px-6 py-3 text-h3 font-semi-bold ${activeTab === 'details' ? 'border-b-2 border-p text-p' : 'text-grey'}`}
                onClick={() => setActiveTab('details')}
              >
                Service Task Details
              </button>
              <button 
                className={`px-6 py-3 text-h3 font-semi-bold ${activeTab === 'previous' ? 'border-b-2 border-p text-p' : 'text-grey'}`}
                onClick={() => setActiveTab('previous')}
              >
                Previous Work
              </button>
              <button 
                className={`px-6 py-3 text-h3 font-semi-bold ${activeTab === 'reviews' ? 'border-b-2 border-p text-p' : 'text-grey'}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="rounded-lg p-6">
            {/* Service Details Tab */}
            {activeTab === 'details' && (
              <div className="w-fit flex flex-col">
                <h2 className="text-h2 font-semi-bold mb-4">Service Task Details</h2>
                {provider.serviceDetails?.length > 0 ? (
                  provider.serviceDetails
                    .filter(detail => detail.serviceId._id === serviceId)
                    .map((detail, index) => (
                      <div key={index} className="flex gap-6 ">
                        {detail.image && (
                          <div className="w-96 h-60 overflow-hidden ">
                            <img 
                              src={detail.image.startsWith("http") ? detail.image : `${apiUrl}${detail.image}`} 
                              alt="Service" 
                              className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(detail.image)}
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                        <h3 className="text-h3 font-semi-bold">{detail.title || "Service Title"}</h3>
                        <p className=" text-h3 mb-4 leading-relaxed">{detail.description || "No description provided."}</p>
                        <div className="flex gap-4 mt-auto justify-end">
                        <p className=" text-h3 font-semi-bold">{detail.duration || "No duration specified."} hrs</p>
                        <p className=" text-h3 font-semi-bold">{detail.timeCredits || "No time credits mentioned."} credits</p>
                        </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-s italic">No service details available.</p>
                )}
              </div>
            )}

            {/* Previous Work Tab */}
            {activeTab === 'previous' && (
              <div className="">
              <h2 className="text-h2 font-semi-bold mb-4">Previous Work</h2>
              {previousWork.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previousWork.map((work) => (
                    <div key={work._id} className=" rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      {/* <img 
                        src={work.requester.profilePicture ? `${apiUrl}${work.requester.profilePicture}` : "https://via.placeholder.com/150"} 
                        alt={`${work.requester.username}'s profile`} 
                        className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      /> */}
                      <div className="p-4">
                        <h3 className="text-h3 font-semi-bold ">{work.serviceName}</h3>
                        <p className="text-h3 mt-1">Requested by: {work.requester.username}</p>
                        <p className="text-h3 mt-1">Time Credits: {work.timeCredits}</p>
                        <p className="text-h3 mt-1">Scheduled Date: {new Date(work.scheduleDate).toLocaleDateString()}</p>
                        <p className="text-h3 mt-1">Completed On: {new Date(work.completedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-s italic">No previous work found.</p>
              )}
            </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between mb-2">
                <h2 className="text-h2 font-semi-bold  mb-4">Client Reviews</h2>
                <button className="bg-p hover:bg-p/90 text-white px-6 py-2 rounded-md font-medium transition-colors" onClick={() => setShowModal(true)}>Add Review</button>
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={review._id} className={`border border-dark-grey rounded-xl p-4 hover:shadow-md transition-shadow w-5/6  ${index % 2 === 0 ? "mr-auto" : "ml-auto"}`}>
                        <div className="flex flex-col items-start">
                          <div className="flex justify-center items-center gap-2">
                          <div className="flex-shrink-0">
                            <img 
                              src={review.user.profilePicture ? `${apiUrl}${review.user.profilePicture}` : "https://via.placeholder.com/150"} 
                              alt={`${review.user.username}'s profile`} 
                              className="w-10 h-10 rounded-full object-cover shadow-lg"
                            />
                          </div>
                            <p className="font-semi-bold text-h3">{review.user.username}</p>
                            </div>
                            <hr className="border border-dark-grey mt-4 w-full"/>
                            <div className="">
                              <ReactStars value={review.rating} edit={false} size={20} isHalf={true} />
                            <p className="text-h3 ">{review.comment}</p>
                            </div>
                          
                          <div className="flex self-end gap-4">
                            <button 
                              className="text-p hover:text-p/60 text-sm font-medium transition-colors" 
                              onClick={() => {
                                setEditingReview(review);
                                setShowModal(true);
                                setRating(review.rating);
                                setComment(review.comment);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-error hover:text-error/60 text-h3 font-regular transition-colors" 
                              onClick={() => handleDeleteReview(review._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-s italic">No reviews yet. Be the first to leave a review!</p>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {fullImage && (
        <div className="fixed inset-0 bg-grey bg-opacity-75 flex justify-center items-center z-50" onClick={closeModal}>
          <div className="relative p-4 max-w-4xl">
            <button
              className="absolute top-0 right-0 text-white bg-p hover:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={closeModal}
            >
              ✕
            </button>
            <img 
              src={fullImage.startsWith("http") ? fullImage : `${apiUrl}${fullImage}`} 
              alt="Full Image" 
              className="max-w-full max-h-[85vh] rounded-md object-contain" 
            />
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-dark-grey bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md w-96 relative">
            <button className="absolute right-3 top-3 text-xl" onClick={() => { setShowModal(false); setEditingReview(null); setRating(0); setComment(""); }}>
              <IoClose size={24} />
            </button>
            <h2 className="text-h2 font-semi-bold">{editingReview ? "Edit Review" : "Add Review"}</h2>
            <ReactStars count={5} size={36} value={rating} isHalf={true} onChange={(newRating) => setRating(newRating)} />
            <textarea className="w-full h-28 border rounded-md p-2 mt-2" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a review..." />
            <button className="bg-p text-white px-4 py-2 rounded-md mt-2 w-full" onClick={editingReview ? handleEditReview : handleReviewSubmit}>{editingReview ? "Update Review" : "Submit Review"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDetails;
