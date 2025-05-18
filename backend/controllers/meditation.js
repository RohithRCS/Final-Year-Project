const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Meditation = require('../models/meditation');
const mongoose = require('mongoose');


// Get all meditations in the database
router.get('/', async (req, res) => {
    try {
        const meditations = await Meditation.find({});
        
        const transformed = meditations.map(meditation => ({
            meditationId: meditation._id,
            title: meditation.title,
            duration: meditation.duration,
            category: meditation.category,
            emoji: meditation.emoji,
            backgroundColor: meditation.backgroundColor,
            youtubeId: meditation.youtubeId,
            description: meditation.description,
            dateAdded: meditation.dateAdded
        }));

        return res.status(200).json(transformed);
    } catch (error) {
        console.error('Error fetching all meditations:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Get all favorite meditations for a user
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from URL params
        
        const user = await User.findById(userId)
            .populate('favouriteMeditation')  // This assumes 'favouriteMeditation' is an array of meditation objects
            .select('favouriteMeditation');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Transform the meditation data to include 'meditationId' instead of '_id'
        const transformedMeditations = user.favouriteMeditation.map(meditation => ({
            meditationId: meditation._id,
            title: meditation.title,
            duration: meditation.duration,
            category: meditation.category,
            emoji: meditation.emoji,
            backgroundColor: meditation.backgroundColor,
            youtubeId: meditation.youtubeId,
            description: meditation.description,
            dateAdded: meditation.dateAdded
        }));
        
        return res.status(200).json(transformedMeditations);
    } catch (error) {
        console.error('Error fetching favorite meditations:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a meditation to favorites
router.post('/:userId/:meditationId', async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from URL params
        const { meditationId } = req.params;
        
        // Validate meditation ID format
        if (!mongoose.Types.ObjectId.isValid(meditationId)) {
            return res.status(400).json({ message: 'Invalid meditation ID format' });
        }
        
        // Check if meditation exists
        const meditation = await Meditation.findById(meditationId);
        if (!meditation) {
            return res.status(404).json({ message: 'Meditation not found' });
        }
        
        // Find user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if meditation is already in favorites
        if (user.favouriteMeditation.includes(meditationId)) {
            return res.status(400).json({ message: 'Meditation is already in favorites' });
        }
        
        // Add to favorites
        user.favouriteMeditation.push(meditationId);
        await user.save();
        
        return res.status(200).json({ 
            message: 'Meditation added to favorites successfully',
            meditationId: meditationId
        });
    } catch (error) {
        console.error('Error adding meditation to favorites:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove a meditation from favorites
router.delete('/:userId/:meditationId', async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from URL params
        const { meditationId } = req.params;
        
        // Validate meditation ID format
        if (!mongoose.Types.ObjectId.isValid(meditationId)) {
            return res.status(400).json({ message: 'Invalid meditation ID format' });
        }
        
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if meditation is in favorites
        if (!user.favouriteMeditation.includes(meditationId)) {
            return res.status(400).json({ message: 'Meditation is not in favorites' });
        }
        
        // Remove from favorites
        user.favouriteMeditation = user.favouriteMeditation.filter(
            id => id.toString() !== meditationId
        );
        
        await user.save();
        
        return res.status(200).json({ 
            message: 'Meditation removed from favorites successfully',
            meditationId: meditationId
        });
    } catch (error) {
        console.error('Error removing meditation from favorites:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Check if a meditation is in favorites
router.get('/check/:userId/:meditationId', async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from URL params
        const { meditationId } = req.params;
        
        // Validate meditation ID format
        if (!mongoose.Types.ObjectId.isValid(meditationId)) {
            return res.status(400).json({ message: 'Invalid meditation ID format' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isFavorite = user.favouriteMeditation.includes(meditationId);
        
        return res.status(200).json({ isFavorite });
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
