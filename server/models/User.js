const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    required: function () { return !this.googleId },
    unique: true,
    trim: true
  },
  googleId: String,
  facebookId: String,
  password: {
    type: String,
    required:  function () { return !this.googleId },
  },
  role: 
  { 
    type: String, 
    enum: ['user', 'admin'],
    default: 'user' 
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  bio: { type: String, default: "" },
  phone: { 
    type: String,
    default: "" ,
    trim: true
  },
  address: {
    type: String,
    default: "",
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
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
  serviceDetails: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      title: { type: String },
      description: { type: String },
      image: { type: String },
      duration: {type: Number },
      timeCredits: {type: Number}
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
UserSchema.index({ location: '2dsphere' });


module.exports = mongoose.model('User', UserSchema); 
