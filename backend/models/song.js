const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  artist: {
    type: String,
    required: true,
    trim: true,
  },
  album: {
    type: String,
    trim: true,
  },
  genre: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number, // Duration in seconds
    required: true,
  },
  releaseYear: {
    type: Number,
  },
  audioUrl: {
    type: String,
    required: true,
    trim: true,
  },
  // Add a field to indicate if the audio is a local file
  isLocalAudio: {
    type: Boolean,
    default: false
  },
  // Add a field for the local audio file name
  localAudioFileName: {
    type: String,
    trim: true,
  },
  coverImageUrl: {
    type: String,
    trim: true,
  },
  isLocalImage: {
    type: Boolean,
    default: false
  },
  localImageFileName: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;