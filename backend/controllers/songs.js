const express = require('express');
const Song = require('../models/song');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all artists with their songs
router.get('/artists', async (req, res) => {
  try {
    // Get all songs
    const songs = await Song.find();
    
    // Group songs by artist
    const artistsMap = {};
    
    songs.forEach(song => {
      if (!artistsMap[song.artist]) {
        artistsMap[song.artist] = {
          name: song.artist,
          songs: [],
          // Use the first song's cover image as the artist image
          coverImageUrl: song.coverImageUrl
        };
      }
      artistsMap[song.artist].songs.push(song);
    });
    
    // Convert to array
    const artists = Object.values(artistsMap);
    
    res.json(artists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get songs by artist
router.get('/artists/:artistName/songs', async (req, res) => {
  try {
    const artistName = req.params.artistName;
    const songs = await Song.find({ artist: artistName });
    
    if (songs.length === 0) {
      return res.status(404).json({ message: 'No songs found for this artist' });
    }
    
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new song (with support for local files)
router.post('/songs', async (req, res) => {
  try {
    const song = new Song(req.body);
    await song.save();
    res.status(201).json(song);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all songs
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced helper function to scan assets folder and create song entries
router.post('/songs/scan-assets', async (req, res) => {
  try {
    // Get the base assets directory - adjust this path based on your project structure
    const baseDir = path.resolve(__dirname, '../../frontend/assets');
    const assetsPath = path.join(baseDir, 'songs');
    const coverPath = path.join(baseDir, 'images');
    
    console.log('Scanning assets directory:', assetsPath);
    
    // Check if directories exist
    if (!fs.existsSync(assetsPath)) {
      return res.status(404).json({ error: `Directory not found: ${assetsPath}` });
    }
    
    // Read the audio directory
    const audioFiles = fs.readdirSync(assetsPath).filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a')
    );
    
    console.log(`Found ${audioFiles.length} audio files`);
    
    // Create song entries for each audio file
    const createdSongs = [];
    const updatedSongs = [];
    
    for (const audioFile of audioFiles) {
      // Extract potential song info from filename (format: Artist - Title.mp3)
      const nameWithoutExt = audioFile.substring(0, audioFile.lastIndexOf('.'));
      let artist = 'Unknown Artist';
      let title = nameWithoutExt;
      
      if (nameWithoutExt.includes(' - ')) {
        [artist, title] = nameWithoutExt.split(' - ');
      }
      
      // Check if a matching cover image exists (same name but with image extension)
      const imageFileNameBase = nameWithoutExt;
      const possibleImageExts = ['.jpg', '.png', '.jpeg', '.webp'];
      let coverImageFile = null;
      
      for (const ext of possibleImageExts) {
        const potentialFile = `${imageFileNameBase}${ext}`;
        const potentialPath = path.join(coverPath, potentialFile);
        
        if (fs.existsSync(potentialPath)) {
          coverImageFile = potentialFile;
          console.log(`Found cover image: ${potentialPath}`);
          break;
        }
      }
      
      // Create a platform-agnostic file URL that can be resolved in the app
      const audioFileUri = `asset://songs/${audioFile}`;
      const coverImageUri = coverImageFile ? `asset://images/${coverImageFile}` : null;
      
      // Create a song entry if it doesn't exist
      let existingSong = await Song.findOne({ localAudioFileName: audioFile });
      
      if (!existingSong) {
        const newSong = new Song({
          title: title,
          artist: artist,
          duration: 180, // Default duration (you may want to extract this from the file)
          audioUrl: audioFileUri,
          isLocalAudio: true,
          localAudioFileName: audioFile,
          coverImageUrl: coverImageUri || 'https://via.placeholder.com/60?text=' + encodeURIComponent(artist),
          isLocalImage: !!coverImageFile,
          localImageFileName: coverImageFile
        });
        
        await newSong.save();
        createdSongs.push(newSong);
        console.log(`Created song: ${artist} - ${title}`);
      } else {
        // Update existing song with new paths if needed
        existingSong.audioUrl = audioFileUri;
        if (coverImageFile) {
          existingSong.coverImageUrl = coverImageUri;
          existingSong.isLocalImage = true;
          existingSong.localImageFileName = coverImageFile;
        }
        await existingSong.save();
        updatedSongs.push(existingSong);
        console.log(`Updated song: ${artist} - ${title}`);
      }
    }
    
    res.status(200).json({
      message: `Scanned ${audioFiles.length} files, created ${createdSongs.length} new songs, updated ${updatedSongs.length} existing songs`,
      createdSongs,
      updatedSongs
    });
  } catch (error) {
    console.error("Error scanning assets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a song by ID
router.get('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a song by ID
router.put('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a song by ID
router.delete('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;