const express = require('express');
const router = express.Router();

// Reference to active chat rooms (needs to be shared from websocket.js)
let chatRoomsRef = null;

// Function to be called from websocket.js to share the chat rooms reference
const setChatRoomsReference = (chatRooms) => {
  chatRoomsRef = chatRooms;
};

// Endpoint to get active chat rooms info
router.get('/chatrooms', (req, res) => {
  if (!chatRoomsRef) {
    return res.status(500).json({ error: 'Chat rooms reference not available' });
  }

  const roomsInfo = {};
  
  chatRoomsRef.forEach((clients, areaKey) => {
    roomsInfo[areaKey] = {
      clientCount: clients.size,
      clients: Array.from(clients).map(client => ({
        userId: client.userId,
        name: client.name,
        coordinates: [client.latitude, client.longitude]
      }))
    };
  });

  res.json({
    totalRooms: chatRoomsRef.size,
    rooms: roomsInfo
  });
});

// Endpoint to trigger a test message to a specific area
router.post('/test-message', (req, res) => {
  const { areaKey, message } = req.body;
  
  if (!chatRoomsRef) {
    return res.status(500).json({ error: 'Chat rooms reference not available' });
  }
  
  if (!chatRoomsRef.has(areaKey)) {
    return res.status(404).json({ error: 'Area key not found' });
  }
  
  const testMessage = {
    type: 'system',
    message: message || 'Test message from server',
    timestamp: new Date().toISOString()
  };
  
  let sentCount = 0;
  chatRoomsRef.get(areaKey).forEach(client => {
    if (client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(JSON.stringify(testMessage));
      sentCount++;
    }
  });
  
  res.json({ 
    success: true, 
    sentTo: sentCount,
    areaKey
  });
});

module.exports = router;
module.exports.setChatRoomsReference = setChatRoomsReference;