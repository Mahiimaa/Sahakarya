const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require("../models/Review");
const mongoose = require("mongoose");

 const getProviderDetails = async (req, res) => {
    try {
      if (!req.params.providerId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid provider ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.providerId)) {
      return res.status(400).json({ error: "Invalid provider ID format." });
    }
    console.log("Received providerId:", req.params.providerId);
    console.log("Is providerId valid?", mongoose.Types.ObjectId.isValid(req.params.providerId));
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

      if (!providerId.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ error: "Invalid provider ID format." });
      }

      console.log("Fetching previous work for provider ID:", providerId);

      const completedBookings = await Booking.find({
          provider: providerId,
          status: "credit transferred",
          confirmedByRequester: true,
          confirmedByProvider: true
      })
      .populate("service", "serviceName") 
      .populate("requester", "username profilePicture");

      const previousWork = completedBookings.map(booking => ({
          _id: booking._id,
          serviceName: booking.service.serviceName,
          requester: {
              username: booking.requester.username,
              profilePicture: booking.requester.profilePicture
          },
          timeCredits: booking.serviceDuration, 
          scheduleDate: booking.scheduleDate,
          completedDate: booking.updatedAt,
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
      const review = await Review.findOne({  _id: reviewId, user: userId});
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
  
  const getTopRatedProviders = async (req, res) => {
    try {
      console.log("Fetching top-rated providers...");
  
      const topProviders = await Review.aggregate([
        {
          $group: {
            _id: "$provider",
            avgRating: { $avg: "$rating" },
            completedJobs: { $sum: 1 },
          },
        },
        { $sort: { avgRating: -1, completedJobs: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "providerDetails"
          },
        },
        { $unwind: { path: "$providerDetails", preserveNullAndEmptyArrays: true } }, 
        {
          $project: {
            _id: "$providerDetails._id",
            username: { $ifNull: ["$providerDetails.username", "Unknown Provider"] }, 
            profilePicture: { $ifNull: ["$providerDetails.profilePicture", "/default-profile.png"] },
            rating: { $ifNull: ["$avgRating", 0] },
            completedJobs: "$completedJobs",
          },
        },
      ]);
  
      console.log(" Debugging: Top Providers Data:", JSON.stringify(topProviders, null, 2));
  
      res.status(200).json({ topProviders });
    } catch (error) {
      console.error(" Error fetching top-rated providers:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
  
  
  
  module.exports = {getProviderDetails, getPreviousWork, addReviews, editReview, deleteReview, getTopRatedProviders};