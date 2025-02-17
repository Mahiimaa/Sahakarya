const User = require('../models/User');

const getAllUsers = async (req, res) => {
  try {
    const { search, role, sortBy } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    const sortOrder = {};
    if (sortBy === 'name') {
      sortOrder.name = 1;
    } else if (sortBy === 'createdAt') {
      sortOrder.createdAt = -1;
    }

    const users = await User.find(filter).sort(sortOrder).select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: 'Role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    console.log("User Details from req.user:", req.user);
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = await User.findById(req.user.id || req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      profilePicture: user.profilePicture || "", 
      services: user.services || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getAllUsers, deleteUser, assignRole, getUserDetails};
