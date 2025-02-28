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
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.provider.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    booking.status = "accepted";
    await booking.save();
    res.json({ message: "Service request accepted", booking });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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

module.exports = { requestService, acceptServiceRequest, completeService };
