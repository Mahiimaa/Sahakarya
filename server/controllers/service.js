const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require("../models/Booking");

// Admin: Add a new service
const addService = async (req, res) => {
  try {
    const { serviceName, description, category } = req.body;

    const newService = new Service({ serviceName, description, category });
    await newService.save();

    res.status(201).json({ message: 'Service added successfully', service: newService });
  } catch (error) {
    res.status(500).json({ message: 'Error adding service', error: error.message });
  }
};

// Admin: Edit an existing service
const editService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedService = await Service.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedService) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json({ message: 'Service updated successfully', service: updatedService });
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
};

// Admin: Delete a service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) return res.status(404).json({ message: 'Service not found' });

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error: error.message });
  }
};

// User: Fetch all active services
const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
    .populate('category', 'categoryName') 
    .sort({ createdAt: -1 });
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
};

// User: Select a service
const selectService = async (req, res) => {
  try {
    const { userId, serviceId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (!user.servicesOffered.includes(serviceId)) {
      user.servicesOffered.push(serviceId);
      await user.save();
    }

    if (!service.selectedBy.includes(userId)) {
      service.selectedBy.push(userId);
      await service.save();
    }

    res.status(200).json({ message: 'Service selected successfully', user, service });
  } catch (error) {
    res.status(500).json({ message: 'Error selecting service', error: error.message });
  }
};

const addServiceOfferDetails = async (req, res) => {
  const { serviceId } = req.params;
  const { title, description, duration, timeCredits } = req.body;
  const userId = req.user._id;

  try {
    console.log("Updating service for user:", userId);
    console.log("Service ID:", serviceId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.serviceDetails) {
      user.serviceDetails = [];
    }

    const serviceIndex = user.serviceDetails.findIndex(s => s.serviceId.toString() === serviceId);

    if (serviceIndex !== -1) {
      user.serviceDetails[serviceIndex].title = title;
      user.serviceDetails[serviceIndex].description = description;
      user.serviceDetails[serviceIndex].duration = duration;
      user.serviceDetails[serviceIndex].timeCredits = timeCredits;
      if (req.file) {
        user.serviceDetails[serviceIndex].image = `/uploads/${req.file.filename}`;
      }
    } else {
      user.serviceDetails.push({
        serviceId,
        title,
        description,
        duration,
        timeCredits,
        image:  req.file ? `/uploads/${req.file.filename}` : null,
      });
    }

    await user.save();
    res.status(200).json({ message: "Service updated successfully", service: user.serviceDetails });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getPopularServices = async (req, res) => {
  try {
    console.log('Fetching Popular Services');

    const popularServices = await Booking.aggregate([
      { 
        $group: { 
          _id: "$service", 
          count: { $sum: 1 } 
        } 
      }, 
      { $sort: { count: -1 } }, 
      { $limit: 5 }, 
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" }, 
      {
        $project: {
          _id: "$serviceDetails._id",
          name: "$serviceDetails.serviceName",
          category: "$serviceDetails.category",
          icon: "$serviceDetails.icon",
          bookings: "$count",
        },
      },
    ]);

    console.log('Popular Services Result:', JSON.stringify(popularServices, null, 2));

    res.status(200).json({ 
      popularServices: popularServices.length > 0 ? popularServices : [],
      message: popularServices.length === 0 ? "No popular services found" : undefined
    });

  } catch (error) {
    console.error('Detailed Error in getPopularServices:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    res.status(500).json({ 
      error: "Server error fetching popular services",
      details: error.message,
      fullError: error
    });
  }
};


module.exports = {
  addService,
  editService,
  deleteService,
  getServices,
  selectService,
  addServiceOfferDetails,
  getPopularServices,
};
