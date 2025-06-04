const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

// File filter to restrict uploads to mp3 and m4a
const fileFilter = (req, file, cb) => {
  // Accept mp3 and m4a files only
  if (file.mimetype === 'audio/mp3' || 
      file.mimetype === 'audio/mpeg' || 
      file.mimetype === 'audio/m4a' || 
      file.mimetype === 'audio/x-m4a') {
    cb(null, true);
  } else {
    cb(new Error('Only MP3 and M4A files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Single route for handling audio transcription
router.post('/', upload.single('audio'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio file uploaded' 
      });
    }

    const audioFile = req.file;
    console.log(`Processing audio file: ${audioFile.path}`);
    
    const pythonScriptPath = path.join(__dirname, "./transcribe_mic.py");

    
    // Run the Python script
    const pythonProcess = spawn('python', [pythonScriptPath, audioFile.path]);

    let transcriptionText = '';
    let errorOutput = '';

    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      transcriptionText += data.toString();
    });

    // Collect error messages from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      
      // Clean up the file after processing
      try {
        fs.unlinkSync(audioFile.path);
        console.log(`Deleted temporary file: ${audioFile.path}`);
      } catch (err) {
        console.error(`Error deleting file: ${err.message}`);
      }
      
      if (code === 0) {
        // Success
        res.status(200).json({
          success: true,
          transcription: transcriptionText.trim()
        });
      } else {
        // Error during transcription
        res.status(500).json({
          success: false,
          message: 'Transcription failed',
          error: errorOutput || `Process exited with code ${code}`
        });
      }
    });
    
    // Handle process errors (e.g., if Python isn't available)
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      
      // Clean up the file
      try {
        fs.unlinkSync(audioFile.path);
      } catch (err) {
        console.error(`Error deleting file: ${err.message}`);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to start transcription process',
        error: error.message
      });
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing audio file',
      error: error.message
    });
  }
});

module.exports = router;
