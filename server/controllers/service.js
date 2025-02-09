const Service = require('../models/Service');
const User = require('../models/User');

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

    // Add service to user's offered services
    if (!user.servicesOffered.includes(serviceId)) {
      user.servicesOffered.push(serviceId);
      await user.save();
    }

    // Add user to service's selectedBy list
    if (!service.selectedBy.includes(userId)) {
      service.selectedBy.push(userId);
      await service.save();
    }

    res.status(200).json({ message: 'Service selected successfully', user, service });
  } catch (error) {
    res.status(500).json({ message: 'Error selecting service', error: error.message });
  }
};

module.exports = {
  addService,
  editService,
  deleteService,
  getServices,
  selectService,
};
