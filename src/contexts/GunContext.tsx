import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import Gun from 'gun';
import 'gun/axe.js';
import 'gun/sea.js';

// Type definitions for Gun
interface GunConstructorOptions {
  peers?: string[];
  localStorage?: boolean;
  file?: boolean;
  web?: boolean;
  axe?: boolean;
  multicast?: boolean;
  retry?: number;
  ws?: {
    maxPayload?: number;
  };
  [key: string]: any;
}

interface IGunNode {
  get: (key: string) => IGunNode;
  put: (data: any, cb?: (ack: any) => void) => IGunNode;
  once: (cb: (data: any) => void) => void;
  on: (cb: (data: any) => void) => void;
  off: () => void;
}

interface IGunInstance extends Gun {
  user: () => any;
  _: {
    opt: {
      peers: Record<string, any>;
    };
  };
  get: (key: string) => IGunNode;
  on: (event: string, callback: (peer: any) => void) => void;
}

interface GunContextType {
  gun: IGunInstance | null;
  user: any;
  isConnected: boolean;
  connectionStatus: 'green' | 'blue' | 'yellow' | 'red';
}

const GunContext = createContext<GunContextType>({
  gun: null,
  user: null,
  isConnected: false,
  connectionStatus: 'yellow'
});

export const useGun = () => useContext(GunContext);

// Debug logging utility with emojis
const debugLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const emoji = {
    info: '📝',
    warn: '⚠️',
    error: '❌'
  };
  const timestamp = new Date().toISOString();
  console[level === 'info' ? 'log' : level](
    `${emoji[level]} [GUN ${timestamp}] ${message}`,
    data || ''
  );
};

// Single GUN instance outside React lifecycle
let globalGunInstance: IGunInstance | null = null;

interface AckType {
  err?: string;
  ok?: number;
}

export const GunProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gun, setGun] = useState<IGunInstance | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'green' | 'blue' | 'yellow' | 'red'>('yellow');
  
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized connection state update
  const updateConnectionState = useCallback((newStatus: 'green' | 'blue' | 'yellow' | 'red') => {
    debugLog('info', `Connection status update: ${newStatus}`);
    setConnectionStatus(newStatus);
    setIsConnected(newStatus === 'green');
  }, []);

  const testConnection = async (gunInstance: IGunInstance) => {
    try {
      const testNode = gunInstance.get('test');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection test timeout')), 2000);
        const data = { ping: Date.now() };
        testNode.put(data);
        testNode.once((data: any) => {
          clearTimeout(timeout);
          if (data && data.ping) {
            resolve();
          } else {
            reject(new Error('Invalid data received'));
          }
        });
      });
      debugLog('info', '✅ Connection test successful');
      return true;
    } catch (error) {
      debugLog('error', '❌ Connection test failed:', error);
      return false;
    }
  };

  const initializeGun = useCallback(() => {
    try {
      debugLog('info', '🔄 Creating new GUN instance');
      const gunOptions = {
        peers: ['http://localhost:8765/gun'],
        localStorage: false,
        file: false,
        web: false,
        axe: false,
        multicast: false,
        retry: 500,
        ws: {
          maxPayload: 50 * 1024 * 1024
        }
      };
      const gunInstance = new Gun(gunOptions as any) as IGunInstance;

      // Debug peer configuration
      debugLog('info', '⚙️ GUN configuration', {
        peers: gunInstance._.opt.peers
      });

      // Connection monitoring
      gunInstance.on('hi', async (peer) => {
        debugLog('info', '🤝 Peer connected', {
          url: peer.url,
          id: peer.id
        });
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        
        // Test connection and update status
        const isConnected = await testConnection(gunInstance);
        if (isConnected) {
          updateConnectionState('green');
        } else {
          updateConnectionState('yellow');
        }
      });

      gunInstance.on('bye', (peer) => {
        debugLog('warn', '👋 Peer disconnected', {
          url: peer.url,
          id: peer.id
        });
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        
        connectionTimeoutRef.current = setTimeout(async () => {
          const connectedPeers = Object.keys(gunInstance._.opt.peers).length;
          if (connectedPeers === 0) {
            debugLog('error', '💔 All peers disconnected');
            updateConnectionState('red');
          } else {
            // Test remaining connections
            const isConnected = await testConnection(gunInstance);
            if (isConnected) {
              updateConnectionState('green');
            } else {
              updateConnectionState('yellow');
            }
          }
        }, 2000);
      });

      // Set references and state
      globalGunInstance = gunInstance;
      setGun(gunInstance);

      // Initialize user
      try {
        const gunUser = gunInstance.user();
        setUser(gunUser);
        debugLog('info', '👤 User initialized');
        updateConnectionState('blue'); // User initialized but not active
      } catch (userError) {
        debugLog('error', '🚫 Error initializing GUN user:', userError);
        updateConnectionState('red');
      }

      // Initial connection test
      testConnection(gunInstance).then(isConnected => {
        if (isConnected) {
          updateConnectionState('green');
        } else {
          updateConnectionState('yellow');
        }
      });

    } catch (error) {
      debugLog('error', '💥 Error initializing GUN:', error);
      updateConnectionState('red');
    }
  }, [updateConnectionState]);

  useEffect(() => {
    debugLog('info', '🎬 GunProvider mounting');
    initializeGun();

    return () => {
      debugLog('info', '🔚 GunProvider unmounting');
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      // Don't clean up global instance on unmount
    };
  }, [initializeGun]);

  return (
    <GunContext.Provider value={{ gun, user, isConnected, connectionStatus }}>
      {children}
    </GunContext.Provider>
  );
}; 