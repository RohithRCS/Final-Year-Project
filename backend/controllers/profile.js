const express = require('express');
const router = express.Router();
const User = require('../models/user');

// PATCH /api/users/:id - Public profile update (no auth)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Optional: restrict updates to safe fields
  const forbiddenFields = ['passwordHash', '_id', 'chats', 'preferences'];
  for (const key of forbiddenFields) {
    if (key in updates) {
      return res.status(400).json({ error: `Cannot update field: ${key}` });
    }
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate(['favoriteSongs', 'favoriteGames', 'favouriteMeditation', 'favouriteExercise', 'preferences']);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser.toJSON());
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

module.exports = router;
