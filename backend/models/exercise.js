const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Stretching', 'Muscle Training', 'Warm Ups', 'Balance', 'Light Cardio']
  },
  emoji: {
    type: String
  },
  backgroundColor: {
    type: String,
    match: /^#([A-Fa-f0-9]{6})$/  // Ensures valid hex color format
  },
  youtubeId: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

module.exports = Exercise;