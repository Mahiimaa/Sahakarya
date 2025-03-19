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
          status: "completed",
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
    const { providerId, rating, comment, bookingId } = req.body;
    const userId = req.user.id;
  
    if (!rating || !comment) return res.status(400).json({ error: "Rating and comment required" });
  
    try {
      const provider = await User.findById(providerId);
      if (!provider) return res.status(404).json({ error: "Provider not found" });
  
      const newReview = new Review({
        provider: providerId,
        user: userId,
        booking: bookingId,
        rating,
        comment,
        createdAt: new Date(),
      });
      await newReview.save();
      await newReview.populate("user", "username profilePicture");
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { reviewed: true });
      }
      res.json({ message: "Review added successfully", review: newReview });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

  const getReviewsByProvider = async (req, res) => {
    const { providerId } = req.params;
  
    try {
      const reviews = await Review.find({ provider: providerId })
        .populate("user", "username profilePicture")
        .sort({ createdAt: -1 });
  
      res.json({ reviews });
    } catch (error) {
      console.error("Error fetching provider reviews:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

  const getReviewsByBooking = async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      const review = await Review.findOne({ booking: bookingId })
        .populate("user", "username profilePicture");
  
      if (!review) {
        return res.status(404).json({ error: "No review found for this booking" });
      }
  
      res.json({ review });
    } catch (error) {
      console.error("Error fetching booking review:", error);
      res.status(500).json({ error: "Server error" });
    }
  };


  const checkReviewExists = async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      const review = await Review.findOne({ booking: bookingId });
      res.json({ exists: !!review });
    } catch (error) {
      console.error("Error checking review existence:", error);
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
      const allReviews = await Review.find({});
      
      console.log('All Reviews:', allReviews.map(review => ({
        _id: review._id,
        provider: review.provider,
        providerType: typeof review.provider,
        isValidObjectId: mongoose.Types.ObjectId.isValid(review.provider)
      })));
      const validProviderIds = allReviews
        .map(review => review.provider)
        .filter(id => mongoose.Types.ObjectId.isValid(id));
  
      console.log('Valid Provider IDs:', validProviderIds);
      const existingProviders = await User.find({
        _id: { $in: validProviderIds }
      });
  
      console.log('Existing Providers:', existingProviders.map(p => ({
        _id: p._id,
        username: p.username
      })));
      const topProviders = await Review.aggregate([
        {
          $match: {
            provider: { 
              $in: existingProviders.map(p => p._id)
            }
          }
        },
        {
          $group: {
            _id: "$provider",
            avgRating: { $avg: "$rating" },
            completedJobs: { $sum: 1 }
          }
        },
        { $sort: { avgRating: -1, completedJobs: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "providerDetails"
          }
        },
        { 
          $unwind: { 
            path: "$providerDetails", 
            preserveNullAndEmptyArrays: false 
          } 
        },
        {
          $project: {
            _id: "$providerDetails._id",
            username: "$providerDetails.username",
            profilePicture: { $ifNull: ["$providerDetails.profilePicture", ""] },
            rating: { $round: ["$avgRating", 1] },
            completedJobs: "$completedJobs"
          }
        }
      ]);
  
      console.log('Top Providers Aggregation Result:', JSON.stringify(topProviders, null, 2));
  
      res.status(200).json({ 
        topProviders: topProviders.length > 0 ? topProviders : [],
        message: topProviders.length === 0 ? "No top providers found" : undefined
      });
  
    } catch (error) {
      console.error('Detailed Error in getTopRatedProviders:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
  
      res.status(500).json({ 
        error: "Server error while fetching top providers",
        details: error.message
      });
    }
  };
  
  
  
  module.exports = {getProviderDetails, getPreviousWork, addReviews, getReviewsByProvider, getReviewsByBooking, checkReviewExists, editReview, deleteReview, getTopRatedProviders};