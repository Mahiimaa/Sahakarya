const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");

const requestService = async (req, res) => {
  try {
    const { serviceId, providerId } = req.body;
    console.log("Service request initiated:", { serviceId, providerId, requester: req.user.id });

    if (!serviceId || !providerId) {
      console.error("Missing serviceId or providerId");
      return res.status(400).json({ error: "Service ID and Provider ID are required" });
    }

    const user = await User.findById(req.user.id);
    const service = await Service.findById(serviceId);

    if (!user) {
      console.error("User not found:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    if (!service) {
      console.error("Service not found:", serviceId);
      return res.status(404).json({ error: "Service not found" });
    }

    if (isNaN(user.timeCredits)) {
      console.error("User's time credits are not a number:", user.timeCredits);
      return res.status(400).json({ error: "User's time credits are invalid." });
    }

    if (isNaN(service.timeCreditsRequired)) {
      console.error("Service's time credits required is not a number:", service.timeCreditsRequired);
      return res.status(400).json({ error: "Invalid service time credits required." });
    }
    if (user.timeCredits < service.timeCreditsRequired) {
      console.error("Not enough time credits. Required:", service.timeCreditsRequired, "Available:", user.timeCredits);
      return res.status(400).json({ error: "Not enough time credits" });
    }

    const updatedTimeCredits = Number(user.timeCredits) - Number(service.timeCreditsRequired);
    user.timeCredits = updatedTimeCredits;
    await user.save();

    const booking = new Booking({
      service: serviceId,
      provider: providerId,
      requester: req.user.id,
      status: "pending",
      serviceDuration: service.duration
    });

    await booking.save();
    console.log("Booking created successfully:", booking);

    res.status(201).json({ message: "Service requested successfully", booking });

  } catch (error){
    console.error("Error requesting service:", error);
    res.status(500).json({ error: "Server error", details: error.message });
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
      booking.confirmedByProvider = true;
    }
    if (booking.confirmedByRequester && booking.confirmedByProvider) {
      booking.status = "completed";
    }
    await booking.save();
    res.json({ message: "Service marked as completed." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
  };

module.exports = { requestService,getUserBookings, acceptServiceRequest, rejectServiceRequest, getServiceRequestsForProvider, getOutgoingBookings, confirmServiceCompletion };
