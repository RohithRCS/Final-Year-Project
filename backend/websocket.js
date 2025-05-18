const WebSocket = require('ws');
const debugController = require('./controllers/debug'); // Import debug controller
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// You'll need to install fluent-ffmpeg and ffmpeg-static
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set up ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Set up a WebSocket server for local chat
const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws/localchat' });

  // Store active chat rooms by geographic area
  const chatRooms = new Map();
  
  // Share chat rooms reference with debug controller
  debugController.setChatRoomsReference(chatRooms);

  // Create uploads directory for voice messages if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads', 'voice');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Helper: Calculate distance between coordinates (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Helper: Generate area key based on 1km grid
  const getAreaKey = (latitude, longitude) => {
    const latGrid = Math.floor(latitude * 100) / 100;
    const lngGrid = Math.floor(longitude * 100) / 100;
    return `${latGrid},${lngGrid}`;
  };

  // Add active connections counter
  let totalConnections = 0;
  
  // Add a map to track user session state
  const userSessions = new Map();

  // Create a function to handle disconnection logic
  const handleClientDisconnect = (ws, clientInfo, areaKey, userId, isExplicitLeave = false) => {
    if (!clientInfo || !areaKey || !chatRooms.has(areaKey)) return;
    
    if (isExplicitLeave) {
      // Remove from active sessions if explicitly leaving
      userSessions.delete(userId);
      
      // Remove from chat room
      chatRooms.get(areaKey).delete(clientInfo);
      console.log(`Client ${clientInfo.name} explicitly left area ${areaKey}`);

      if (chatRooms.get(areaKey).size === 0) {
        chatRooms.delete(areaKey);
        console.log(`Removed empty chat room for area ${areaKey}`);
      } else {
        const leaveMessage = {
          type: 'system',
          message: `${clientInfo.name} left the local chat`,
          timestamp: new Date().toISOString(),
        };

        chatRooms.get(areaKey).forEach(client => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(leaveMessage));
          }
        });
        
        console.log(`Now ${chatRooms.get(areaKey).size} clients in area ${areaKey}`);
      }
    } else {
      // If not explicit leave (connection dropped), keep the user session for reconnection
      // but update the websocket connection status
      console.log(`Client ${clientInfo.name} disconnected but may reconnect`);
      
      // We could notify others that the user is temporarily offline
      // but it's probably better UX to wait for reconnection attempts first
    }
  };

  // Save the voice message to disk as MP3 and return its URL path
  const saveVoiceMessage = (audioData, userId) => {
    return new Promise((resolve, reject) => {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const tempFilename = `temp_${userId}_${timestamp}_${randomString}.webm`;
      const outputFilename = `voice_${userId}_${timestamp}_${randomString}.mp3`; // Changed to mp3
      const tempFilepath = path.join(uploadsDir, tempFilename);
      const outputFilepath = path.join(uploadsDir, outputFilename);
      
      try {
        // Convert base64 to buffer and save temporary webm file
        const buffer = Buffer.from(audioData, 'base64');
        fs.writeFileSync(tempFilepath, buffer);
        
        // Convert webm to mp3 using ffmpeg
        ffmpeg(tempFilepath)
          .output(outputFilepath)
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .on('end', () => {
            // Remove temporary file
            fs.unlinkSync(tempFilepath);
            console.log(`Voice message converted to MP3: ${outputFilename}`);
            // Return the relative URL path to access this file
            resolve(`/uploads/voice/${outputFilename}`);
          })
          .on('error', (err) => {
            console.error('Error converting voice message to MP3:', err);
            // Fallback: if conversion fails, use the original webm file
            fs.renameSync(tempFilepath, path.join(uploadsDir, `voice_${userId}_${timestamp}_${randomString}.webm`));
            resolve(`/uploads/voice/voice_${userId}_${timestamp}_${randomString}.webm`);
          })
          .run();
      } catch (error) {
        console.error('Error processing voice message:', error);
        reject(error);
      }
    });
  };

  // Alternative function to save as M4A (AAC) if needed
  const saveVoiceMessageAsM4A = (audioData, userId) => {
    return new Promise((resolve, reject) => {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const tempFilename = `temp_${userId}_${timestamp}_${randomString}.webm`;
      const outputFilename = `voice_${userId}_${timestamp}_${randomString}.m4a`; // Changed to m4a
      const tempFilepath = path.join(uploadsDir, tempFilename);
      const outputFilepath = path.join(uploadsDir, outputFilename);
      
      try {
        // Convert base64 to buffer and save temporary webm file
        const buffer = Buffer.from(audioData, 'base64');
        fs.writeFileSync(tempFilepath, buffer);
        
        // Convert webm to m4a using ffmpeg
        ffmpeg(tempFilepath)
          .output(outputFilepath)
          .audioCodec('aac')
          .audioBitrate('128k')
          .on('end', () => {
            // Remove temporary file
            fs.unlinkSync(tempFilepath);
            console.log(`Voice message converted to M4A: ${outputFilename}`);
            // Return the relative URL path to access this file
            resolve(`/uploads/voice/${outputFilename}`);
          })
          .on('error', (err) => {
            console.error('Error converting voice message to M4A:', err);
            // Fallback: if conversion fails, use the original webm file
            fs.renameSync(tempFilepath, path.join(uploadsDir, `voice_${userId}_${timestamp}_${randomString}.webm`));
            resolve(`/uploads/voice/voice_${userId}_${timestamp}_${randomString}.webm`);
          })
          .run();
      } catch (error) {
        console.error('Error processing voice message:', error);
        reject(error);
      }
    });
  };

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    totalConnections++;
    console.log(`New WebSocket connection established (Total: ${totalConnections})`);

    let clientInfo = null;
    let clientAreaKey = null;
    let clientId = null;

    ws.isAlive = true;
    
    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()); // Ensure message is converted to string
        console.log(`Received message type: ${data.type}`);

        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
            message: 'Server received your ping'
          }));
          return;
        }

        if (data.type === 'join') {
          clientId = data.userId;
          
          // Check if this is a reconnection for an existing user
          const existingSession = userSessions.get(clientId);
          const isReconnect = data.reconnect && existingSession;
          
          // Store client details
          clientInfo = {
            userId: data.userId,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius || 1000,
            ws: ws,
            joinTime: existingSession ? existingSession.joinTime : new Date()
          };

          clientAreaKey = getAreaKey(data.latitude, data.longitude);
          console.log(`Client ${isReconnect ? 're-joined' : 'joined'} area: ${clientAreaKey}`);

          // Initialize room if not exists
          if (!chatRooms.has(clientAreaKey)) {
            chatRooms.set(clientAreaKey, new Set());
          }

          // If reconnecting, remove old connection from the room
          if (isReconnect && existingSession && existingSession.areaKey) {
            const oldRoom = chatRooms.get(existingSession.areaKey);
            if (oldRoom) {
              // Find and remove the old client reference
              oldRoom.forEach(client => {
                if (client.userId === clientId) {
                  oldRoom.delete(client);
                }
              });
            }
          }

          // Add client to room
          chatRooms.get(clientAreaKey).add(clientInfo);
          
          // Update user session
          userSessions.set(clientId, {
            clientInfo,
            areaKey: clientAreaKey,
            joinTime: clientInfo.joinTime,
            lastActivity: new Date()
          });

          // Send the user their previous messages in this room (if any exist)
          // This could be implemented with a message history cache

          // Only notify others if this is not a reconnect
          if (!isReconnect) {
            // Notify others in the area
            const joinMessage = {
              type: 'system',
              message: `${data.name} joined the local chat`,
              timestamp: new Date().toISOString(),
            };

            chatRooms.get(clientAreaKey).forEach(client => {
              if (client.ws.readyState === WebSocket.OPEN && client.userId !== clientId) {
                client.ws.send(JSON.stringify(joinMessage));
              }
            });
          } else {
            // Just notify the reconnected user
            ws.send(JSON.stringify({
              type: 'system',
              message: `Reconnected to chat successfully`,
              timestamp: new Date().toISOString(),
            }));
          }

          // Always notify user of room size
          ws.send(JSON.stringify({
            type: 'system',
            message: `${chatRooms.get(clientAreaKey).size} people in this local chat`,
            timestamp: new Date().toISOString(),
          }));
          
          console.log(`Now ${chatRooms.get(clientAreaKey).size} clients in area ${clientAreaKey}`);
        }

        else if (data.type === 'leave') {
          // Explicit leave request
          handleClientDisconnect(ws, clientInfo, clientAreaKey, clientId, true);
        }

        else if (data.type === 'chat' && clientAreaKey) {
          // Update last activity time for the user session
          if (clientId && userSessions.has(clientId)) {
            const session = userSessions.get(clientId);
            session.lastActivity = new Date();
            userSessions.set(clientId, session);
          }
          
          data.timestamp = data.timestamp || new Date().toISOString();
          console.log(`Chat message from ${clientInfo.name} in area ${clientAreaKey}`);

          // Make sure to broadcast to all clients in the room including sender
          // This ensures everyone sees the same message with the same timestamp
          chatRooms.get(clientAreaKey).forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify(data));
            }
          });
        }
        
        // Handle voice messages with new MP3 conversion
        else if (data.type === 'voice' && clientAreaKey) {
          // Update last activity time for the user session
          if (clientId && userSessions.has(clientId)) {
            const session = userSessions.get(clientId);
            session.lastActivity = new Date();
            userSessions.set(clientId, session);
          }
          
          console.log(`Voice message from ${clientInfo.name} in area ${clientAreaKey}`);
          
          try {
            // Save the voice message file and convert to MP3
            const voicePath = await saveVoiceMessage(data.audioData, clientId);
            
            // Create the message to broadcast
            const voiceMessage = {
              type: 'voice',
              sender: data.sender,
              name: clientInfo.name,
              userId: clientId,
              voiceUrl: voicePath,
              duration: data.duration || 0,
              timestamp: new Date().toISOString()
            };
            
            // Broadcast to all clients in the room including sender
            chatRooms.get(clientAreaKey).forEach(client => {
              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(voiceMessage));
              }
            });
          } catch (error) {
            console.error('Failed to process voice message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process voice message.',
            }));
          }
        }

      } catch (error) {
        console.error('Error handling WebSocket message:', error.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format.',
        }));
      }
    });

    ws.on('close', () => {
      totalConnections--;
      console.log(`WebSocket connection closed (Total remaining: ${totalConnections})`);
      
      // Handle disconnection but don't notify others yet - allow for reconnection
      handleClientDisconnect(ws, clientInfo, clientAreaKey, clientId, false);
    });
  });

  // Heartbeat to check for stale connections (60 seconds interval)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 60000); // 60 seconds for more tolerance

  // Clean up abandoned sessions periodically (3 hours of inactivity)
  const sessionCleanupInterval = setInterval(() => {
    const now = new Date();
    const inactiveThreshold = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    
    // Check each user session
    userSessions.forEach((session, userId) => {
      // Get the client from the room
      let activeClient = false;
      if (session.areaKey && chatRooms.has(session.areaKey)) {
        chatRooms.get(session.areaKey).forEach(client => {
          if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
            activeClient = true;
          }
        });
      }
      
      // If no active connection and the session is old, clean it up
      if (!activeClient && (now - session.lastActivity > inactiveThreshold)) {
        console.log(`Cleaning up inactive session for user ${userId}`);
        userSessions.delete(userId);
        
        // Also remove from any chat rooms
        if (session.areaKey && chatRooms.has(session.areaKey)) {
          chatRooms.get(session.areaKey).forEach(client => {
            if (client.userId === userId) {
              chatRooms.get(session.areaKey).delete(client);
              
              // Notify others that this user has left
              const leaveMessage = {
                type: 'system',
                message: `${client.name} has disconnected`,
                timestamp: new Date().toISOString(),
              };
              
              chatRooms.get(session.areaKey).forEach(c => {
                if (c.ws.readyState === WebSocket.OPEN) {
                  c.ws.send(JSON.stringify(leaveMessage));
                }
              });
            }
          });
        }
      }
    });
  }, 30 * 60 * 1000); // Run every 30 minutes
  
  // Periodically clean up old voice messages (7 days)
  const voiceCleanupInterval = setInterval(() => {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading voice uploads directory:', err);
        return;
      }
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for file ${file}:`, err);
            return;
          }
          
          // Check if file is older than maxAge
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, err => {
              if (err) {
                console.error(`Error deleting old voice file ${file}:`, err);
              } else {
                console.log(`Deleted old voice file: ${file}`);
              }
            });
          }
        });
      });
    });
  }, 24 * 60 * 60 * 1000); // Run once a day
  
  // Clean up intervals when the WebSocket server closes
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(sessionCleanupInterval);
    clearInterval(voiceCleanupInterval);
  });
  
  return wss;
};

module.exports = setupWebSocketServer;