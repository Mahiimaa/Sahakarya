const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");

const requestService = async (req, res) => {
  try {
    const { serviceId, providerId } = req.body;
    const user = await User.findById(req.user.id);
    const service = await Service.findById(serviceId);

    if (!service) return res.status(404).json({ error: "Service not found" });

    if (user.timeCredits < service.timeCreditsRequired) {
      return res.status(400).json({ error: "Not enough time credits" });
    }

    const booking = new Booking({
      service: serviceId,
      provider: providerId,
      requester: req.user.id,
      status: "pending",
    });

    await booking.save();
    res.status(201).json({ message: "Service requested successfully", booking });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const acceptServiceRequest = async (req, res) => {
  try {
    const { scheduleDate, serviceDuration } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.provider.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    if (!scheduleDate || !serviceDuration) {
      return res.status(400).json({ error: "Schedule date and duration are required" });
    }
    booking.status = "scheduled";
    booking.scheduleDate = scheduleDate;
    booking.serviceDuration = serviceDuration;
    await booking.save();
    res.json({ message: "Service request accepted", booking });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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

const completeService = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.requester.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the requester can confirm completion" });
    }

    const requester = await User.findById(booking.requester);
    requester.timeCredits -= booking.service.timeCreditsRequired;
    await requester.save();

    const provider = await User.findById(booking.provider);
    provider.timeCredits += booking.service.timeCreditsRequired;
    await provider.save();

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    res.json({ message: "Service exchange completed", booking });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { requestService, acceptServiceRequest, rejectServiceRequest, getServiceRequestsForProvider, getOutgoingBookings, completeService };
