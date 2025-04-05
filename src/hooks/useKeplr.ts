import { useState, useCallback } from 'react';
import { connectKeplr, disconnectKeplr, getKeplrAddress } from '../utils/wallet';

export const useKeplr = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      const addr = await connectKeplr();
      setAddress(addr);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectKeplr();
    setAddress(null);
    setIsConnected(false);
  }, []);

  return {
    address,
    isConnected,
    connect,
    disconnect
  };
}; 