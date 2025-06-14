const Service = require('../models/Service');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path'); 

const getServiceDetails = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const providers = await User.find({
      servicesOffered: id,
      _id: { $ne: currentUserId } 
    }).select("username email serviceDetails profilePicture location address");
    
    const providersWithDetails = providers.map(user => {
      const serviceDetail = user.serviceDetails.find(d => d?.serviceId?.toString() === id);
      if (!serviceDetail || !serviceDetail.title || !serviceDetail.description || !serviceDetail.duration || !serviceDetail.timeCredits) {
        return null;
      }
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        location: user.location,
        address: user.address,
        serviceDetail: {
          title: serviceDetail.title || "N/A",
          description: serviceDetail.description || "N/A",
          image: serviceDetail.image || null,
          duration: serviceDetail.duration || "N/A",
          timeCredits: serviceDetail.timeCredits,
        }
      };
    })
    .filter(Boolean);

    res.status(200).json({
      service,
      providers: providersWithDetails,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service details', error: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId).populate("provider", "username email");
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserServices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ services: user.serviceDetails || [] });
  } catch (error) {
    console.error("Error fetching user services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateServiceDetails = async (req, res) => {
  const { serviceId } = req.params;
  const { title, description, duration, timeCredits } = req.body;
  const userId = req.user._id;

  try {
    console.log("Updating service for user:", userId, "Service ID:", serviceId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.serviceDetails) {
      return res.status(404).json({ message: "No services found for user" });
    }

    const serviceIndex = user.serviceDetails.findIndex((s) => s.serviceId.toString() === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).json({ message: "Service not found" });
    }

    user.serviceDetails[serviceIndex].title = title || user.serviceDetails[serviceIndex].title;
    user.serviceDetails[serviceIndex].description = description || user.serviceDetails[serviceIndex].description;
    user.serviceDetails[serviceIndex].duration = duration || user.serviceDetails[serviceIndex].duration;
    user.serviceDetails[serviceIndex].timeCredits = timeCredits || user.serviceDetails[serviceIndex].timeCredits;

    if (req.file) {
      if (user.serviceDetails[serviceIndex].image) {
        try {
          const oldFilePath = path.join(__dirname, '..', user.serviceDetails[serviceIndex].image);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.log('Failed to delete old service image:', err);
        }
      }

      user.serviceDetails[serviceIndex].image = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      message: "Service updated successfully",
      service: user.serviceDetails[serviceIndex],
    });

  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUserService = async (req, res) => {
  const { serviceId } = req.params;
  const userId = req.user._id;

  try {
    console.log("Deleting service for user:", userId, "Service ID:", serviceId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.serviceDetails) {
      return res.status(404).json({ message: "No services found for user" });
    }

    const serviceIndex = user.serviceDetails.findIndex((s) => s.serviceId.toString() === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (user.serviceDetails[serviceIndex].image) {
      try {
        const imagePath = path.join(__dirname, '..', user.serviceDetails[serviceIndex].image);
        await fs.unlink(imagePath);
      } catch (err) {
        console.log("Failed to delete service image:", err);
      }
    }
    user.serviceDetails.splice(serviceIndex, 1);
    await user.save();

    res.status(200).json({ message: "Service deleted successfully" });

  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllServiceDetails = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const users = await User.find(
      { _id: { $ne: loggedInUserId }, "serviceDetails.0": { $exists: true } },
      "username email profilePicture serviceDetails"
    ).populate({
      path: "serviceDetails",
      select: "serviceId title description image duration timeCredits", 
    });

    const servicesMap = {};

    users.forEach((user) => {
      user.serviceDetails.forEach((detail) => {
        if (!detail.title || !detail.description || !detail.duration || !detail.timeCredits) {
          return;
        }
        if (!servicesMap[detail.serviceId]) {
          servicesMap[detail.serviceId] = {
            serviceId: detail.serviceId,
            _id: detail._id,
            serviceName: detail.title,
            description: detail.description,
            duration: detail.duration,
            timeCredits: detail.timeCredits,
            image: detail.image,
            providers: [],
          };
        }
        servicesMap[detail.serviceId].providers.push({
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
        });
      });
    });
    const servicesWithProviders = Object.values(servicesMap);

    res.status(200).json({ services: servicesWithProviders });
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ message: "Error fetching service details", error: error.message });
  }
};
module.exports = { getServiceDetails, getServiceById, getUserServices, updateServiceDetails, deleteUserService, getAllServiceDetails};
