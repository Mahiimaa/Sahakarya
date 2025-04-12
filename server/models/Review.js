const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});
ReviewSchema.index({ provider: 1 });
module.exports = mongoose.model("Review", ReviewSchema);
