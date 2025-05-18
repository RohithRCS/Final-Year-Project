const express = require('express');
const User = require('../models/user');
const Song = require('../models/song');

const router = express.Router();

// Add a song to user's favorites
router.post('/favorites/:songId', async (req, res) => {
  try {
    const songId = req.params.songId;
    const { userId } = req.body;

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favoriteSongs.includes(songId)) {
      return res.status(400).json({ message: 'Song is already in favorites' });
    }

    user.favoriteSongs.push(songId);
    await user.save();

    res.status(200).json({ message: 'Song added to favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a song from user's favorites
router.delete('/favorites/:songId', async (req, res) => {
  try {
    const songId = req.params.songId;
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.favoriteSongs.indexOf(songId);
    if (index === -1) {
      return res.status(400).json({ message: 'Song is not in favorites' });
    }

    user.favoriteSongs.splice(index, 1);
    await user.save();

    res.status(200).json({ message: 'Song removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all favorite songs for a user
router.get('/favorites', async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId).populate('favoriteSongs');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.favoriteSongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a song is in user's favorites
router.get('/favorites/check/:songId', async (req, res) => {
  try {
    const songId = req.params.songId;
    const { userId } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isFavorite = user.favoriteSongs.includes(songId);
    res.status(200).json({ isFavorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
