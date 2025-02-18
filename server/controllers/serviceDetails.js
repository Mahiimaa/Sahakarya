const Service = require('../models/Service');
const User = require('../models/User'); 

const getServiceDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const providers = await User.find({
      servicesOffered: id,
    });

    res.status(200).json({
      service,
      providers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service details', error: error.message });
  }
};

module.exports = { getServiceDetails };
