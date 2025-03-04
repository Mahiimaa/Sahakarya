const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;