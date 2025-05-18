// utils/audioUtils.js
const fs = require('fs');
const mm = require('music-metadata');

/**
 * Extract metadata from an audio file
 * @param {string} filePath Full path to the audio file
 * @returns {Promise<Object>} Metadata object
 */
const extractMetadata = async (filePath) => {
  try {
    const metadata = await mm.parseFile(filePath);
    
    // Extract useful information
    const info = {
      title: metadata.common.title || 'Unknown Title',
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown Genre',
      year: metadata.common.year || null,
      duration: metadata.format.duration || 0,
    };
    
    return info;
  } catch (error) {
    console.error('Error extracting metadata:', error.message);
    return {
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      genre: 'Unknown Genre',
      year: null,
      duration: 0,
    };
  }
};

module.exports = {
  extractMetadata
};