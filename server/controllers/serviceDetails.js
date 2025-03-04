const Service = require('../models/Service');
const User = require('../models/User'); 

const getServiceDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const providers = await User.find({
      servicesOffered: id,
    }).select("username email serviceDetails profilePicture");
    
    const providersWithDetails = providers.map(user => {
      const serviceDetail = user.serviceDetails.find(detail => detail.serviceId.toString() === id);
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        serviceDetail: serviceDetail || null,
      };
    });
    
    res.status(200).json({
      service,
      providers,
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

module.exports = { getServiceDetails, getServiceById };
