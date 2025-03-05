const Service = require('../models/Service');
const User = require('../models/User');

 const getProviderDetails = async (req, res) => {
    try {
      const provider = await User.findById(req.params.id).populate("reviews.user", "username");
      if (!provider) return res.status(404).json({ error: "Provider not found" });
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const addReviews = async (req, res) => {
    const { providerId, rating, comment } = req.body;
    const userId = req.user.id; // Assuming user is authenticated
  
    if (!rating || !comment) return res.status(400).json({ error: "Rating and comment required" });
  
    try {
      const provider = await User.findById(providerId);
      if (!provider) return res.status(404).json({ error: "Provider not found" });
  
      const newReview = {
        user: userId,
        rating,
        comment,
        createdAt: new Date(),
      };
  
      provider.reviews.push(newReview);
      await provider.save();
  
      res.json({ message: "Review added successfully", review: newReview });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const editReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
  
    try {
      const provider = await User.findOne({ "reviews._id": reviewId, "reviews.user": userId });
      if (!provider) return res.status(404).json({ error: "Review not found or unauthorized" });
  
      const review = provider.reviews.id(reviewId);
      review.rating = rating;
      review.comment = comment;
      review.updatedAt = new Date();
  
      await provider.save();
      res.json({ message: "Review updated successfully", review });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
  
    try {
      const provider = await User.findOne({ "reviews._id": reviewId, "reviews.user": userId });
      if (!provider) return res.status(404).json({ error: "Review not found or unauthorized" });
  
      provider.reviews = provider.reviews.filter((rev) => rev._id.toString() !== reviewId);
      await provider.save();
  
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
  
  module.exports = {getProviderDetails, addReviews, editReview, deleteReview};