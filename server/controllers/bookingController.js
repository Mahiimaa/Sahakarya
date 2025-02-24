const Booking = require("../models/Booking");

const bookService = async (req, res) => {
  try {
    const { serviceId, providerId, date, duration } = req.body;

    if (!serviceId || !providerId || !date || !duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const booking = new Booking({
      user: req.user.id,
      provider: providerId,
      service: serviceId,
      date,
      duration,
      status: "pending",
    });

    await booking.save();
    res.status(201).json({ message: "Service booked successfully", booking });

  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service")
      .populate("provider", "username email");
    
    res.json({ bookings });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    booking.status = "confirmed";
    await booking.save();

    res.json({ message: "Service exchange confirmed", booking });

  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { bookService, getUserBookings, confirmBooking };
