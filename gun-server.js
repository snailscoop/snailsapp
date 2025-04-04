import Gun from 'gun';
import 'gun/axe.js';
import http from 'http';

// Create HTTP server first
const server = http.createServer().listen(8765);

// Configure GUN with better message handling
const gun = Gun({
  web: server,
  file: 'data.json',
  multicast: false,
  axe: false,
  peers: [], // Start with no peers since we're the server
  // Increase WebSocket payload limit and add message size check
  ws: { 
    maxPayload: 50 * 1024 * 1024, // 50MB limit
    verifyClient: (info) => {
      console.log('🔌 New WebSocket connection attempt:', info.req.url);
      return true;
    }
  }
});

// Message size monitoring
gun.on('out', (msg) => {
  const size = JSON.stringify(msg).length;
  if (size > 10 * 1024 * 1024) { // 10MB limit
    console.error('⚠️ Dropping oversized message:', size, 'bytes');
    return;
  }
  console.log('📤 Outgoing message size:', size, 'bytes');
});

gun.on('in', (msg) => {
  const size = JSON.stringify(msg).length;
  console.log('📥 Incoming message size:', size, 'bytes');
});

console.log('🚀 GUN server started on port 8765');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 GUN server shutting down...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
}); 