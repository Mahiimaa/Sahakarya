import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";

function ProviderDetails() {
  const { providerId } = useParams();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/providers/${providerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProvider(data);
        // setReviews(data.reviews || []);
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="px-10 mt-6">
        <button className="text-blue-600 hover:text-blue-800 mb-4" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {provider && (
          <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">{provider.username}</h1>
            <p className="text-gray-600">{provider.email}</p>

            {/* Reviews */}
            <h3 className="text-lg font-semibold mt-6">User Reviews:</h3>
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-3 flex justify-between">
                <div>
                  <p className="font-semibold">{review.user.username}</p>
                  <p className="text-yellow-500">⭐ {review.rating}/5</p>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
                <div>
                  <button className="text-blue-600 mr-2" onClick={() => setEditingReview(review)}>Edit</button>
                  <button className="text-red-600" onClick={() => handleDeleteReview(review._id)}>Delete</button>
                </div>
              </div>
            ))}

            {/* Review Form */}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
            <button onClick={editingReview ? handleEditReview : handleReviewSubmit}>
              {editingReview ? "Update Review" : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderDetails;
