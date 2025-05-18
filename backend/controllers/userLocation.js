const express = require("express");
const router = express.Router();
const UserLocation = require("../models/userLocation");

// ✅ Save or update user location
router.post("/location", async (req, res) => {
  console.log("POST /location hit");
  const { userId, latitude, longitude } = req.body;

  try {
    const updated = await UserLocation.findOneAndUpdate(
      { userId },
      {
        userId,
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Location saved", data: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to save location" });
  }
});

// 📍 Get nearby users within X meters
router.get("/nearby", async (req, res) => {
  const { latitude, longitude, radius = 1000 } = req.query; // radius in meters

  try {
    const nearbyUsers = await UserLocation.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius)
        }
      }
    });

    res.status(200).json(nearbyUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch nearby users" });
  }
});

module.exports = router;
