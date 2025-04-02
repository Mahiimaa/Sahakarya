const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Service = require('../models/Service');

const editProfile = async (req, res) => {
  try {
    console.log("Updating profile for user ID:", req.user.id);
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    const { username, email, phone, address } = req.body;
    const services = req.body.services || [];
    const userId = req.user.id;
    
    const selectedServices = Array.isArray(services)
      ? services
      : typeof services === 'string'
        ? [services]
        : [];
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle profile picture if provided
    if (req.file) {
      // Delete old picture if it exists
      if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
        try {
          const oldFilePath = path.join(__dirname, '..', user.profilePicture);
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.log('Failed to delete old profile picture:', err);
        }
      }
      // Set new profile picture
      user.profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // Update user fields
    user.username = username || user.username;
    if (email && email !== user.email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    user.servicesOffered = selectedServices;
    
    const validServices = [];
    for (const serviceId of selectedServices) {
      const service = await Service.findById(serviceId);
      if (!service) {
        console.log(`Service with ID ${serviceId} not found.`);
        continue;
      }
      
      if (!service.selectedBy.includes(userId)) {
        await Service.findByIdAndUpdate(
          serviceId,
          { $addToSet: { selectedBy: userId } }, 
          { new: true, runValidators: false } 
        );
        console.log(`User added to selectedBy for service: ${service.serviceName}`);
      }
      validServices.push(serviceId);
    }
    user.servicesOffered = validServices;

    await user.save();
    console.log('User saved successfully!');
    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address:user.address,
        role: user.role,
        profilePicture: user.profilePicture,
        services: user.servicesOffered
      }
    });
    
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = {
  editProfile,
};