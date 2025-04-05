import Gun from 'gun';
import 'gun/axe.js';
import http from 'http';
import { WebSocketServer } from 'ws';
const { verifyADR36Amino } = require('@keplr-wallet/cosmos');

// Create HTTP server with CORS support
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      peerCount: connectedPeers.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      wsConnections: wss.clients.size
    }));
    return;
  }
}).listen(8765);

console.log('🚀 GUN server started on port 8765');

// Create WebSocket server with optimized settings
const wss = new WebSocketServer({ 
  server,
  maxPayload: 100 * 1024 * 1024, // 100MB max payload
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Track connected peers with metadata
const connectedPeers = new Map();

// Configure Gun with optimized settings
const gun = new Gun({
  web: server,
  ws: wss,
  file: false,
  radisk: false,
  localStorage: false,
  axe: false,
  multicast: false,
  retry: 3,
  peers: {
    'ws://localhost:8765/gun': {
      retry: 3,
      timeout: 5000
    }
  }
});

// Optimized heartbeat mechanism
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('💔 Client heartbeat failed, terminating connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Enhanced peer tracking
gun.on('hi', peer => {
  connectedPeers.set(peer.id, {
    ...peer,
    connectedAt: Date.now(),
    lastSeen: Date.now()
  });
  console.log('🤝 Peer connected:', {
    id: peer.id,
    url: peer.url,
    totalPeers: connectedPeers.size
  });
});

gun.on('bye', peer => {
  connectedPeers.delete(peer.id);
  console.log('👋 Peer disconnected:', {
    id: peer.id,
    url: peer.url,
    totalPeers: connectedPeers.size
  });
});

// Handle permit-based authentication with rate limiting
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_WINDOW = 5 * 60 * 1000; // 5 minutes

gun.on('auth', async (data) => {
  const { address, signature } = data;
  if (!address || !signature) {
    return { err: 'Missing address or signature' };
  }

  // Rate limiting
  const now = Date.now();
  const attempts = authAttempts.get(address) || [];
  const recentAttempts = attempts.filter(time => now - time < AUTH_WINDOW);
  
  if (recentAttempts.length >= MAX_AUTH_ATTEMPTS) {
    return { err: 'Too many authentication attempts' };
  }

  recentAttempts.push(now);
  authAttempts.set(address, recentAttempts);

  try {
    const isValid = await verifySignature(address, signature);
    if (!isValid) {
      return { err: 'Invalid signature' };
    }

    gun.get('users').get(address).get('auth').put({ 
      signature,
      lastAuth: now
    });
    return { ok: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return { err: 'Authentication failed' };
  }
});

async function verifySignature(address, signature) {
  try {
    const { permit, signature: sig } = signature;
    const message = JSON.stringify({
      type: permit.params.permit_name,
      data: permit.data
    });

    const verified = await verifyADR36Amino(
      permit.params.chain_id,
      address,
      message,
      sig
    );

    return verified;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Graceful shutdown with cleanup
process.on('SIGINT', () => {
  console.log('🛑 GUN server shutting down...');
  clearInterval(heartbeatInterval);
  
  // Close all WebSocket connections
  wss.clients.forEach(ws => {
    ws.close(1000, 'Server shutting down');
  });
  
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
}); 