const Category = require('../models/Category');
const Service = require('../models/Service');

const addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({ categoryName });
    await newCategory.save();

    res.status(201).json({ message: 'Category added successfully', category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error adding category', error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ categoryName: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const services = await Service.find({ category: id });
    console.log('Associated services:', services);
    if (services.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category. Services are associated with it.' });
    }
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error.message);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

module.exports = {
  addCategory,
  getCategories,
  deleteCategory
};