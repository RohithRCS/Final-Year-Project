const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const User = require('../models/user');

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get user's favorite games
router.get('/:userId/favoriteGames', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favoriteGames');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.favoriteGames || []);
  } catch (error) {
    console.error('Error fetching favorite games:', error);
    res.status(500).json({ error: 'Failed to fetch favorite games' });
  }
});

// Add a game to user's favorites
router.post('/:userId/favoriteGames/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.favoriteGames.includes(gameId)) {
      return res.status(400).json({ error: 'Game already in favorites' });
    }

    user.favoriteGames.push(gameId);
    await user.save();

    res.status(201).json({ message: 'Game added to favorites' });
  } catch (error) {
    console.error('Error adding game to favorites:', error);
    res.status(500).json({ error: 'Failed to add game to favorites' });
  }
});

// Remove a game from user's favorites
router.delete('/:userId/favoriteGames/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const gameIndex = user.favoriteGames.indexOf(gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Game not found in favorites' });
    }

    user.favoriteGames.splice(gameIndex, 1);
    await user.save();

    res.json({ message: 'Game removed from favorites' });
  } catch (error) {
    console.error('Error removing game from favorites:', error);
    res.status(500).json({ error: 'Failed to remove game from favorites' });
  }
});

module.exports = router;
