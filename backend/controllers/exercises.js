const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Exercise = require('../models/exercise');

// GET all exercises
router.get('/all', async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.status(200).json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET user's favorite exercises
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId).populate('favouriteExercise');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.favouriteExercise);
  } catch (error) {
    console.error('Error fetching favorite exercises:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add an exercise to favorites
router.post('/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favouriteExercise.includes(exerciseId)) {
      return res.status(400).json({ message: 'Exercise already in favorites' });
    }

    user.favouriteExercise.push(exerciseId);
    await user.save();

    res.status(200).json({ message: 'Exercise added to favorites', exercise });
  } catch (error) {
    console.error('Error adding exercise to favorites:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove an exercise from favorites
router.delete('/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.favouriteExercise.includes(exerciseId)) {
      return res.status(400).json({ message: 'Exercise not in favorites' });
    }

    user.favouriteExercise = user.favouriteExercise.filter(
      id => id.toString() !== exerciseId
    );
    await user.save();

    res.status(200).json({ message: 'Exercise removed from favorites' });
  } catch (error) {
    console.error('Error removing exercise from favorites:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if an exercise is in the user's favorites
router.get('/check/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.body.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isFavorite = user.favouriteExercise.includes(exerciseId);
    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
