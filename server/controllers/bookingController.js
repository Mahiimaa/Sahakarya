const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");

const requestService = async (req, res) => {
  try {
    const { serviceId, providerId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const provider = await User.findById(providerId);
    if (!provider) return res.status(404).json({ error: "Provider not found" });

    const serviceDetail = provider.serviceDetails.find(
      (detail) => detail.serviceId.toString() === serviceId
    );

    if (!serviceDetail || typeof serviceDetail.timeCredits !== "number") {
      return res.status(400).json({ error: "Invalid service time credits required." });
    }

    const requiredTimeCredits = serviceDetail.timeCredits;

    if (user.timeCredits < requiredTimeCredits) {
      return res.status(400).json({ error: "Not enough time credits" });
    }

    const existingBooking = await Booking.findOne({
      service: serviceId,
      requester: req.user.id,
      status: { $nin: ["completed", "rejected"] },
    });

    if (existingBooking) {
      return res.status(400).json({ error: "You have already requested this service." });
    }
    user.timeCredits -= requiredTimeCredits;
    await user.save();

    const booking = new Booking({
      service: serviceId,
      provider: providerId,
      requester: req.user.id,
      status: "pending",
      serviceDuration: serviceDetail.duration,
    });
    // io.to(providerId).emit("newNotification", {
    //   message: `You have a new service request from ${requester}`,
    //   createdAt: new Date(),
    //   isRead: false,
    // });
    await booking.save();
    res.status(201).json({ message: "Service requested successfully", booking });
  } catch (error) {
    console.error("Error requesting service:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ requester: userId }).populate("service provider");

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const acceptServiceRequest = async (req, res) => {
    const { bookingId } = req.params;
    const { scheduleDate, serviceDuration } = req.body;
    const userId = req.user.id;

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
  
      if (booking.provider.toString() !== userId) {
        return res.status(403).json({ error: "Unauthorized to accept this request" });
      }
  
      if (!scheduleDate || !serviceDuration) {
        return res.status(400).json({ error: "Schedule date and duration required" });
      }
  
      booking.status = "scheduled";
      booking.scheduleDate = scheduleDate;
      booking.serviceDuration = serviceDuration;
  
      await booking.save();
      res.json({ message: "Service request accepted and scheduled", booking });
  
    } catch (error) {
      console.error("Error accepting request:", error);
      res.status(500).json({ error: "Server error while accepting request" });
    }
  };

const rejectServiceRequest = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.provider.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    booking.status = "rejected";
    await booking.save();
    res.json({ message: "Service request rejected", booking });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getServiceRequestsForProvider = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user.id })
      .populate("requester", "username email")
      .populate("service", "serviceName timeCreditsRequired");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching provider requests:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getOutgoingBookings = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    const bookings = await Booking.find({ requester: userId })
      .populate("provider", "username email") 
      .populate("service", "serviceName"); 
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching outgoing service requests:", error);
    res.status(500).json({ message: "Error fetching outgoing requests" });
  }
};

const submitProviderCompletion = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { actualDuration, proposedCredits, completionNotes } = req.body;
    const userId = req.user.id;

    if (!actualDuration || !proposedCredits) {
      return res.status(400).json({ error: "Actual duration and proposed credits are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.provider.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to submit completion for this booking" });
    }

    booking.actualDuration = actualDuration;
    booking.proposedCredits = proposedCredits;
    booking.completionNotes = completionNotes;
    booking.confirmedByProvider = true;
    booking.status = "awaiting requester confirmation";

    await booking.save();
    res.json({ 
      message: "Completion details submitted successfully", 
      status: booking.status,
      confirmedByProvider: booking.confirmedByProvider
    });
  } catch (error) {
    console.error("Error submitting completion details:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const confirmServiceCompletion = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.requester.toString() === userId) {
      booking.confirmedByRequester = true;
    } else if (booking.provider.toString() === userId) {
      return res.status(400).json({ error: "Providers should use the detailed completion form" });
    } else {
      return res.status(403).json({ error: "Unauthorized to confirm this booking" });
    }

    if (booking.confirmedByRequester && booking.confirmedByProvider) {
      booking.status = "completed";
    }
    
    await booking.save();
    res.json({ 
      message: "Service marked as completed.", 
      status: booking.status,
      confirmedByRequester: booking.confirmedByRequester,
      confirmedByProvider: booking.confirmedByProvider
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
  };

  const disputeCompletion = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { disputeReason } = req.body;
      const userId = req.user.id;
  
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
  
      if (booking.requester.toString() !== userId) {
        return res.status(403).json({ error: "Unauthorized to dispute this booking" });
      }
  
      booking.status = "disputed";
      booking.disputeReason = disputeReason;
      booking.confirmedByRequester = false;
      
      await booking.save();
      res.json({ message: "Service completion disputed", status: booking.status });
    } catch (error) {
      console.error("Error disputing completion:", error);
      res.status(500).json({ error: "Server error" });
    }
  };

module.exports = { requestService,getUserBookings, acceptServiceRequest, rejectServiceRequest, getServiceRequestsForProvider, getOutgoingBookings, submitProviderCompletion, confirmServiceCompletion, disputeCompletion };
