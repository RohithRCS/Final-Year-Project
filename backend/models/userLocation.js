const mongoose = require("mongoose");

const userLocationSchema = new mongoose.Schema({  // <-- this line is important
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// ✅ Add 2dsphere index properly
userLocationSchema.index({ location: "2dsphere" });

const UserLocation = mongoose.model("location", userLocationSchema); // model from schema

module.exports = UserLocation;
