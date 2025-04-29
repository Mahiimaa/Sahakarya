const ServiceRequest = require('../models/ServiceRequest');
const { createNotification } = require('./bookingController');
const User = require('../models/User');

const createServiceRequest = async (req, res) => {
  try {
    const { serviceName, description } = req.body;
    const userId = req.user.id;

    if (!serviceName) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const serviceRequest = new ServiceRequest({
      serviceName,
      description: description || '',
      requestedBy: userId
    });

    await serviceRequest.save();
    const admins = await User.find({ role: "admin" });

  for (const admin of admins) {
    await createNotification(
      admin._id,
      `New service request received: ${serviceName}`,
      "serviceRequest",
      {
        serviceId: serviceRequest._id,
        senderId: userId,
      },
      admin._id.toString() === userId.toString() ? null : userId
    );
  }

    res.status(201).json({
      status: 'success',
      message: 'Service request submitted successfully',
      data: {
        serviceRequest
      }
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      error: 'Failed to submit service request'
    });
  }
};

const getAllServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate('requestedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: serviceRequests.length,
      data: {
        serviceRequests
      }
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      error: 'Failed to fetch service requests'
    });
  }
};

module.exports = {createServiceRequest, getAllServiceRequests};