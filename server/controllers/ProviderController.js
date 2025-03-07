const Service = require('../models/Service');
const User = require('../models/User');
const Review = require("../models/Review");

 const getProviderDetails = async (req, res) => {
    try {
      if (!req.params.providerId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid provider ID format." });
    }
      console.log("Fetching provider with ID:", req.params.providerId);
      const provider = await User.findById(req.params.providerId).populate("serviceDetails.serviceId", "serviceName");
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      const reviews = await Review.find({ provider: req.params.providerId }).populate("user", "username");
      res.json({provider, reviews});
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const addReviews = async (req, res) => {
    const { providerId, rating, comment } = req.body;
    const userId = req.user.id;
  
    if (!rating || !comment) return res.status(400).json({ error: "Rating and comment required" });
  
    try {
      const provider = await User.findById(providerId);
      if (!provider) return res.status(404).json({ error: "Provider not found" });
  
      const newReview = new Review({
        provider: providerId,
        user: userId,
        rating,
        comment,
        createdAt: new Date(),
      });
      await newReview.save();
  
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
      const review = await User.findOne({  _id: reviewId, user: userId});
      if (!review) return res.status(404).json({ error: "Review not found or unauthorized" });
  
      review.rating = rating;
      review.comment = comment;
      review.updatedAt = new Date();
  
      await review.save();
      res.json({ message: "Review updated successfully", review });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
  
    try {
      const review = await User.findOneAndDelete({ _id: reviewId, user: userId });
      if (!review) return res.status(404).json({ error: "Review not found or unauthorized" });
  
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
  
  module.exports = {getProviderDetails, addReviews, editReview, deleteReview};