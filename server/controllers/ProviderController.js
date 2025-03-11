const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');
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
      const reviews = await Review.find({ provider: req.params.providerId }).populate("user", "username profilePicture");
      res.json({provider, reviews});
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

const getPreviousWork = async (req, res) => {
  try {
      const { providerId } = req.params;

      // Validate providerId format
      if (!providerId.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ error: "Invalid provider ID format." });
      }

      console.log("Fetching previous work for provider ID:", providerId);

      // Find all completed bookings where provider is this providerId
      const completedBookings = await Booking.find({
          provider: providerId,
          status: "credit transferred",
          confirmedByRequester: true,
          confirmedByProvider: true
      })
      .populate("service", "serviceName") // Fetch service details (service name)
      .populate("requester", "username profilePicture"); // Fetch requester details (username, profile)

      // Format response with additional details
      const previousWork = completedBookings.map(booking => ({
          _id: booking._id,
          serviceName: booking.service.serviceName,
          requester: {
              username: booking.requester.username,
              profilePicture: booking.requester.profilePicture
          },
          timeCredits: booking.serviceDuration, // Assuming serviceDuration = time credits
          scheduleDate: booking.scheduleDate,
          completedDate: booking.updatedAt, // Assuming updatedAt is when it was confirmed as completed
      }));

      res.json({ previousWork });
  } catch (error) {
      console.error("Error fetching previous work:", error);
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
      await newReview.populate("user", "username profilePicture");
  
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
      const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
      if (!review) return res.status(404).json({ error: "Review not found or unauthorized" });
  
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
  
  module.exports = {getProviderDetails, getPreviousWork, addReviews, editReview, deleteReview};