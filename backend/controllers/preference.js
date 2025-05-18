const express = require('express');
const router = express.Router();
const Preference = require('../models/preference');
const User = require('../models/user');

// Get preferences for a user by userId
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.query.userId).populate('preferences');
    if (!user || !user.preferences) {
      return res.status(404).json({ message: 'No preferences found for this user' });
    }
    res.json(user.preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update user preferences (public, no auth)
router.post('/', async (req, res) => {
  try {
    const { userId, ...preferencesData } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let savedPreferences;
    if (user.preferences) {
      savedPreferences = await Preference.findByIdAndUpdate(
        user.preferences,
        preferencesData,
        { new: true, runValidators: true }
      );
    } else {
      const newPreferences = new Preference(preferencesData);
      savedPreferences = await newPreferences.save();
      user.preferences = savedPreferences._id;
      await user.save();
    }

    res.status(200).json(savedPreferences);
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update preferences by userId (safe fallback if post isn't used)
router.patch('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.preferences) {
      return res.status(404).json({ error: 'Preferences not found for user' });
    }

    const updated = await Preference.findByIdAndUpdate(user.preferences, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update preferences' });
  }
});


module.exports = router;
