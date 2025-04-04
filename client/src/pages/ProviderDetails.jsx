import React, {  useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";
import ReactStars from "react-rating-stars-component";
import { IoClose } from "react-icons/io5";
import { ArrowLeft , Star, MessageSquare, Clock, Award, X } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState(serviceId ? "details" : "reviews");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, [apiUrl, token]);

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
      setShowReviewModal(false);
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
      setShowReviewModal(false);
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

  const isReviewOwner = (review) => {
    return currentUser && review.user._id === currentUser._id;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-screen">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-4"></div>
          <div className="w-48 h-6 bg-gray-200 animate-pulse mb-2"></div>
          <div className="w-32 h-4 bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    )
  }

  const openGmailCompose = () => {
    const email = provider.email;
    const subject = encodeURIComponent("Service Inquiry from Sahakarya");
    const body = encodeURIComponent(`Hi ${provider.username},\n\nI'm interested in your services listed on Sahakarya.\nPlease let me know your availability.`);
  
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  
    window.open(gmailUrl, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-poppins">
      <Navbar />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="h-32 bg-p/80 items-center justify-center flex text-white text-h1 font-semi-bold">Detailed Information</div> 
          <div className="p-6 pt-0 relative flex">
            <div className="absolute -top-12 left-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
                <img
                  src={
                    provider.profilePicture ? `${apiUrl}${provider.profilePicture}` : "https://via.placeholder.com/150"
                  }
                  alt={`${provider.username}'s profile`}
                  className="w-full h-full object-cover"
                  onClick={() => navigate(`/user-profile/${provider._id}`)}
                />
              </div>
            </div>

            <div className="ml-32 sm:ml-0 sm:mt-14 flex flex-col sm:flex-row sm:items-center w-full sm:justify-between">
              <div>
                <h1 className="text-lg font-medium text-gray-700">{provider.username}</h1>
                <p className="text-gray-500 text-sm">{provider.email}</p>

                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(calculateAverageRating()) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 ">
                <button onClick={openGmailCompose}
                className="bg-[#7B7FEF] hover:bg-[#6A6EE0] text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Provider
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex">
            {serviceId && (
              <button
                className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === "details" ? "border-b-2 border-[#7B7FEF] text-[#7B7FEF]" : "text-gray-900 hover:text-p"}`}
                onClick={() => setActiveTab("details")}
              >
                Service Details
              </button>
            )}
            <button
              className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === "previous" ? "border-b-2 border-[#7B7FEF] text-[#7B7FEF]" : "text-gray-900 hover:text-p "}`}
              onClick={() => setActiveTab("previous")}
            >
              Previous Work
            </button>
            <button
              className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === "reviews" ? "border-b-2 border-[#7B7FEF] text-[#7B7FEF]" : "text-gray-900 hover:text-p"}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg">
          {/* Service Details Tab */}
          {activeTab === "details" && (
            <div className="w-full">
              <div className="flex items-center mb-6">
                <Award className="mr-2 h-5 w-5 text-[#7B7FEF]" />
                <h2 className="text-lg font-medium">Service Details</h2>
              </div>

              {provider.serviceDetails?.length > 0 ? (
                provider.serviceDetails
                  .filter((detail) => detail.serviceId._id === serviceId)
                  .map((detail, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden mb-6">
                      {detail.image && (
                        <div className="w-full h-48 sm:h-60 overflow-hidden">
                          <img
                            src={detail.image.startsWith("http") ? detail.image : `${apiUrl}${detail.image}`}
                            alt="Service"
                            className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() => handleImageClick(detail.image)}
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-xl font-medium text-gray-800 mb-2">{detail.title || "Service Title"}</h3>
                        <p className="text-gray-600 mb-4">{detail.description || "No description provided."}</p>
                        <div className="flex gap-4">
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 text-[#7B7FEF] mr-1" />
                            <span>{detail.duration || "N/A"} hrs</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Award className="h-4 w-4 text-[#7B7FEF] mr-1" />
                            <span>{detail.timeCredits || "N/A"} credits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 italic">No service details available.</p>
              )}
            </div>
          )}

          {/* Previous Work Tab */}
          {activeTab === "previous" && (
            <div>
              <div className="flex items-center mb-6">
                <Clock className="mr-2 h-5 w-5 text-[#7B7FEF]" />
                <h2 className="text-lg font-medium text-gray-800">Previous Work</h2>
              </div>

              {previousWork.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousWork.map((work) => (
                    <div key={work._id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 mb-2">{work.serviceName}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start">
                            <span className="text-gray-500 w-28">Requested by:</span>
                            <span className="text-gray-700">{work.requester.username}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-28">Time Credits:</span>
                            <span className="text-[#7B7FEF] font-medium">{work.timeCredits}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-28">Scheduled:</span>
                            <span className="text-gray-700">{formatDate(work.scheduleDate)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-500 w-28">Completed:</span>
                            <span className="text-gray-700">{formatDate(work.completedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No previous work found.</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              <div className="flex items-center mb-6">
                <Star className="mr-2 h-5 w-5 text-[#7B7FEF]" />
                <h2 className="text-lg font-medium text-gray-800">Client Reviews</h2>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={review._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <img
                              src={
                                review.user.profilePicture
                                  ? `${apiUrl}${review.user.profilePicture}`
                                  : "https://via.placeholder.com/150"
                              }
                              alt={`${review.user.username}'s profile`}
                              className="w-8 h-8 rounded-full object-cover"
                              onClick={() => navigate(`/user-profile/${review.user._id}`)}
                            />
                          </div>
                          <div>
                            <p onClick={() => navigate(`/user-profile/${review.user._id}`)}
                            className="font-medium text-gray-800">{review.user.username}</p>
                            <p className="text-xs text-gray-500">{formatDate(review.createdAt || new Date())}</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>

                        {isReviewOwner(review) && (
                          <div className="flex justify-end gap-4 mt-3">
                            <button
                              className="text-[#7B7FEF] hover:text-[#6A6EE0] text-sm font-medium transition-colors"
                              onClick={() => {
                                setEditingReview(review)
                                setShowReviewModal(true)
                                setRating(review.rating)
                                setComment(review.comment)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                              onClick={() => handleDeleteReview(review._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No reviews yet. Be the first to leave a review!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {fullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-full max-h-full">
            <button
              className="absolute top-2 right-2 text-white bg-[#7B7FEF] hover:bg-[#6A6EE0] rounded-full w-8 h-8 flex items-center justify-center z-10"
              onClick={(e) => {
                e.stopPropagation()
                closeModal()
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={fullImage.startsWith("http") ? fullImage : `${apiUrl}${fullImage}`}
              alt="Full Image"
              className="max-w-full max-h-[85vh] rounded-md object-contain"
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowReviewModal(false)
                setEditingReview(null)
                setRating(0)
                setComment("")
              }}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-medium text-gray-800 mb-4">{editingReview ? "Edit Review" : "Add Review"}</h2>
            <div className="flex justify-center mb-4">
              <ReactStars
                count={5}
                size={36}
                value={rating}
                isHalf={true}
                onChange={(newRating) => setRating(newRating)}
              />
            </div>
            <textarea
              className="w-full h-28 border rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#7B7FEF] focus:border-transparent"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a review..."
            />
            <div className="flex justify-end gap-3">
              <button
                className="border text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#7B7FEF] text-white px-4 py-2 rounded-md hover:bg-[#6A6EE0] transition-colors"
                onClick={editingReview ? handleEditReview : handleReviewSubmit}
              >
                {editingReview ? "Update Review" : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDetails;
