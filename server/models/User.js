const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported

// Define User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: 
  { 
    type: String, 
    enum: ['user', 'admin'],
    default: 'user' 
  },
  phone: { 
    type: String,
    default: "" ,
    trim: true
  },
  profilePicture: { 
    type: String, default: "" 
  },
  resetToken: String,
  resetTokenExpiry: Date,

  servicesOffered: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service', 
    },
  ],
  timeCredits: { type: Number, default: 0 },
},
{
  timestamps: true
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', UserSchema); 
