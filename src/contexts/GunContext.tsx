import React, { createContext, useContext, useEffect, useState } from 'react';
import Gun from 'gun';
import { Permit } from '../utils/wallet';

interface GunContextType {
  gun: Gun | null;
  connectionState: boolean;
  diagnostics: {
    wsStatus: boolean;
    healthStatus: boolean;
  };
  authenticateUser: (address: string, permit: Permit) => Promise<void>;
  isAuthenticated: boolean;
  connectedPeers: Map<string, any>;
}

interface GunPeer {
  url: string;
  id: string;
}

const GunContext = createContext<GunContextType | null>(null);

const PRIMARY_PEER = 'ws://localhost:8765/gun';

export const GunProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gun, setGun] = useState<Gun | null>(null);
  const [connectionState, setConnectionState] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectedPeers] = useState(() => new Map());
  const [diagnostics, setDiagnostics] = useState({
    wsStatus: false,
    healthStatus: false
  });

  const authenticateUser = async (address: string, permit: Permit) => {
    if (!gun) throw new Error('Gun instance not initialized');

    try {
      // Store the permit in Gun for this user
      const userRef = gun.get('users').get(address);
      await new Promise<void>((resolve, reject) => {
        userRef.get('permit').put(permit, (ack) => {
          if (ack.err) reject(new Error(ack.err));
          else resolve();
        });
      });

      // Mark user as authenticated
      setIsAuthenticated(true);

      // Set up user data structure
      userRef.get('data').put({
        lastActive: Date.now(),
        address
      });

    } catch (error) {
      console.error('Failed to authenticate user:', error);
      throw error;
    }
  };

  const testPeer = async (peer: string) => {
    try {
      const ws = new WebSocket(peer);
      return new Promise<boolean>((resolve) => {
        ws.onopen = () => {
          console.log(`📝 [GUN ${new Date().toISOString()}] ✅ Peer ${peer} is healthy `);
          ws.close();
          resolve(true);
        };
        ws.onerror = () => {
          console.log(`📝 [GUN ${new Date().toISOString()}] ❌ Peer ${peer} is unhealthy`);
          resolve(false);
        };
        setTimeout(() => {
          ws.close();
          resolve(false);
        }, 2000);
      });
    } catch (error) {
      console.error(`Failed to test peer ${peer}:`, error);
      return false;
    }
  };

  const discoverPeers = async () => {
    const isHealthy = await testPeer(PRIMARY_PEER);
    setConnectionState(isHealthy);
    setDiagnostics(prev => ({
      ...prev,
      wsStatus: isHealthy
    }));
    return isHealthy;
  };

  useEffect(() => {
    const initializeGun = async () => {
      const isHealthy = await discoverPeers();
      
      if (!isHealthy) {
        console.error('No healthy peers found');
        return;
      }

      const gunInstance = new Gun({
        peers: [PRIMARY_PEER],
        localStorage: false,
        radisk: false,
        multicast: false
      });

      // Add connection monitoring
      gunInstance.on('hi', (peer: GunPeer) => {
        console.log(`📝 [GUN ${new Date().toISOString()}] Peer connected:`, peer);
        connectedPeers.set(peer.id, peer);
        setConnectionState(true);
      });

      gunInstance.on('bye', (peer: GunPeer) => {
        console.log(`📝 [GUN ${new Date().toISOString()}] Peer disconnected:`, peer);
        connectedPeers.delete(peer.id);
        discoverPeers();
      });

      // Add authentication monitoring
      gunInstance.on('auth', (ack) => {
        if (ack.err) {
          console.error('Gun authentication error:', ack.err);
          setIsAuthenticated(false);
        } else {
          console.log('Gun authenticated:', ack);
          setIsAuthenticated(true);
        }
      });

      setGun(gunInstance);
    };

    initializeGun();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(discoverPeers, 30000);

    return () => {
      clearInterval(healthCheckInterval);
      if (gun) {
        gun.off();
      }
    };
  }, []);

  return (
    <GunContext.Provider value={{ 
      gun, 
      connectionState, 
      diagnostics,
      authenticateUser,
      isAuthenticated,
      connectedPeers
    }}>
      {children}
    </GunContext.Provider>
  );
};

export const useGun = () => {
  const context = useContext(GunContext);
  if (!context) {
    throw new Error('useGun must be used within a GunProvider');
  }
  return context;
}; 