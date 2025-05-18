const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const gameSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  }
});

const Game = model('Game', gameSchema, 'games');

module.exports = Game;