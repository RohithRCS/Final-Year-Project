// testClient.js
const WebSocket = require('ws');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values for testing
const defaultConfig = {
  userId: 'test-user-' + Math.floor(Math.random() * 1000),
  name: 'TestUser',
  latitude: 37.7749,
  longitude: -122.4194, // San Francisco coordinates
  radius: 1000 // 1 km
};

// Ask for server URL
rl.question('WebSocket URL (default: ws://localhost:1234/ws/localchat): ', (url) => {
  const wsUrl = url || 'ws://localhost:1234/ws/localchat';
  const ws = new WebSocket(wsUrl);
  
  console.log(`Connecting to ${wsUrl}...`);
  
  ws.on('open', () => {
    console.log('Connected to WebSocket server');
    
    rl.question(`User ID (default: ${defaultConfig.userId}): `, (userId) => {
      defaultConfig.userId = userId || defaultConfig.userId;
      
      rl.question(`Name (default: ${defaultConfig.name}): `, (name) => {
        defaultConfig.name = name || defaultConfig.name;
        
        rl.question(`Latitude (default: ${defaultConfig.latitude}): `, (lat) => {
          defaultConfig.latitude = parseFloat(lat) || defaultConfig.latitude;
          
          rl.question(`Longitude (default: ${defaultConfig.longitude}): `, (lng) => {
            defaultConfig.longitude = parseFloat(lng) || defaultConfig.longitude;
            
            // Join chat
            const joinMessage = {
              type: 'join',
              userId: defaultConfig.userId,
              name: defaultConfig.name,
              latitude: defaultConfig.latitude,
              longitude: defaultConfig.longitude,
              radius: defaultConfig.radius
            };
            
            ws.send(JSON.stringify(joinMessage));
            console.log(`Joining chat as ${defaultConfig.name} at location [${defaultConfig.latitude}, ${defaultConfig.longitude}]`);
            
            // Now start receiving/sending messages
            console.log('\n==== WebSocket Test Client ====');
            console.log('Type a message and press Enter to send');
            console.log('Type /quit to exit');
            console.log('Type /ping to test connection');
            console.log('==============================\n');
            
            rl.on('line', (input) => {
              if (input === '/quit') {
                ws.close();
                rl.close();
                return;
              }
              
              if (input === '/ping') {
                ws.send(JSON.stringify({ type: 'ping' }));
                return;
              }
              
              const chatMessage = {
                type: 'chat',
                userId: defaultConfig.userId,
                name: defaultConfig.name,
                message: input,
                timestamp: new Date().toISOString()
              };
              
              ws.send(JSON.stringify(chatMessage));
            });
          });
        });
      });
    });
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'chat') {
        console.log(`[${new Date(message.timestamp).toLocaleTimeString()}] ${message.name}: ${message.message}`);
      } else if (message.type === 'system') {
        console.log(`[SYSTEM] ${message.message}`);
      } else if (message.type === 'pong') {
        console.log(`[SERVER] ${message.message}`);
      } else if (message.type === 'error') {
        console.log(`[ERROR] ${message.message}`);
      } else {
        console.log(`[UNKNOWN] ${JSON.stringify(message)}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Disconnected from WebSocket server');
    rl.close();
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    rl.close();
  });
});