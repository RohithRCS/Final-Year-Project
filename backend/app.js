const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const logger = require('./utils/logger');
const middleware = require('./utils/middleware');

const signupRouter = require('./controllers/signup');
const loginRouter = require('./controllers/login');
const chatRouter = require('./controllers/chat');
const songRouter = require('./controllers/songs');
const userLocationRoutes = require('./controllers/userLocation');
const favRouter = require('./controllers/favouriteSong')
const favgame = require('./controllers/games')
const profile = require('./controllers/profile')
const meditation = require('./controllers/meditation')
const favexercise = require('./controllers/exercises')
const preference = require('./controllers/preference')
const transcribeRouter = require('./controllers/transcribe')
const setupWebSocketServer = require('./websocket');

mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://shakthi1112:shakthi%401112@cluster0.oera9.mongodb.net/Companion?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB:', error.message);
  });

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket

// Setup WebSocket server
setupWebSocketServer(server);

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/uploads/voice', express.static(path.join(__dirname, 'uploads/voice')));
console.log("Serving static files from:", path.join(__dirname, 'uploads/voice'));

// Routes
app.use('/api/signup', signupRouter);
app.use('/api/login', loginRouter);
app.use('/api/chat', chatRouter);
app.use('/api', songRouter);
app.use('/api', userLocationRoutes);
app.use('/api', favRouter)
app.use('/api/game', favgame)
app.use('/api/meditation', meditation)
app.use('/api/exercise', favexercise)
app.use('/api/userPreference', preference)
app.use('/api/edit', profile)
// Use the transcribe router instead of a direct route handler
app.use('/api/transcribe', transcribeRouter);

let highScores = [];

// Get high scores
app.get('/api/scores', (req, res) => {
  res.json(highScores.slice(0, 10)); // Return top 10 scores
});

// Submit a new score
app.post('/api/scores', (req, res) => {
  const { playerName, score } = req.body;
  
  if (!playerName || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid data' });
  }

  highScores.push({ playerName, score, date: new Date() });
  highScores.sort((a, b) => b.score - a.score); // Sort descending
  
  res.status(201).json({ success: true });
});


// Error handling
app.use(middleware.requestLogger);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = server; // Export the server, not just the app