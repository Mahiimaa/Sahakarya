import React, {  useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";
import ReactStars from "react-rating-stars-component";

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
  console.log("Extracted serviceId:", serviceId);
  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        console.log("Fetching provider details for ID:", providerId); 
        const { data } = await axios.get(`${apiUrl}/api/providers/${providerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched Provider Data:", data);
        setProvider(data.provider);
        setReviews(data.reviews);
      } catch (error) {
        console.error("Error fetching provider details:", error);
      }
    };
    fetchProviderDetails();
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="px-10 ">
        {provider && (
          <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
            <div className="flex gap-4">
              <img 
                src={provider.profilePicture ? `${apiUrl}${provider.profilePicture}` : "https://via.placeholder.com/150"} 
                alt="Provider" 
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="">
            <h1 className="text-h2 font-bold">{provider.username}</h1>
            <p className="text-dark-grey">{provider.email}</p>
            </div>
            </div>
            {provider.serviceDetails?.length > 0 && (
              <div className="mt-4">
                 {provider.serviceDetails
                    .filter(detail => detail.serviceId._id === serviceId)
                    .map((detail, index) => (
                  <div key={index} className="mt-4 border-b border-dark-grey pb-4 flex flex-col gap-2">
                    <h2 className="text-h3 font-semi-bold">{detail.title || "Service Title"}</h2>
                    <p className="text-grey">{detail.description || "No description provided."}</p>
                    {detail.image && (
                      <div className="w-full flex justify-center">
                      <img 
                        src={detail.image.startsWith("http") ? detail.image : `${apiUrl}${detail.image}`} 
                        alt="Service" 
                        className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90"
                        onClick={() => handleImageClick(detail.image)}
                      />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {fullImage && (
              <div className="fixed inset-0 bg-grey bg-opacity-70 flex justify-center items-center z-50">
                <div className="relative p-4 rounded-lg max-w-3xl">
                  <button
                    className="absolute top-2 right-2 text-white bg-p rounded-full px-2 py-1 text-sm"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
                  <img src={`${apiUrl}${fullImage}`} alt="Full Image" className="max-w-full max-h-[80vh] rounded-md" />
                </div>
              </div>
            )}
            {/* Reviews */}
            <h3 className="text-h2 font-semi-bold mt-6 pb-4">Reviews</h3>
            {reviews.length > 0 ? (
              reviews.map((review) => (
              <div key={review._id} className=" border border-light-grey rounded-md p-4 pb-3 flex justify-between">
                <div>
                  <p className="font-semi-bold">{review.user.username}</p>
                  <ReactStars value={review.rating} edit={false} size={24} isHalf={true} />
                  <p className="text-grey">{review.comment}</p>
                </div>
                <div>
                  <button className="text-p mr-2" onClick={() => setEditingReview(review)}>Edit</button>
                  <button className="text-error" onClick={() => handleDeleteReview(review._id)}>Delete</button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-grey">No reviews yet.</p>
          )}
            {/* Review Form */}
            <h3 className="text-h3 font-semi-bold mt-6">Leave a Review</h3>
            <ReactStars
              count={5}
              size={36}
              value={rating}
              isHalf={true}
              onChange={(newRating) => setRating(newRating)}
            />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            className="w-full border border-dark-grey rounded-md p-2 mt-4"
            placeholder="Write a review..."/>
            <button 
            className="bg-p text-white px-4 py-2 rounded-md mt-2 flex " 
            onClick={handleReviewSubmit}>
              Submit Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderDetails;
