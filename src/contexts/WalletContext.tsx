import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { connectKeplr, disconnectKeplr, getKeplrAddress } from '../utils/wallet';

interface WalletContextType {
  address: string | null;
  client: SigningCosmWasmClient | null;
  isConnecting: boolean;
  error: string | null;
  walletStatus: 'loading' | 'success' | 'error';
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Create a default connect function that returns a rejected promise with a meaningful error
const defaultConnect = async () => {
  throw new Error('WalletContext not initialized');
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  client: null,
  isConnecting: false,
  error: null,
  walletStatus: 'loading',
  connect: defaultConnect,
  disconnect: () => {},
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [client, setClient] = useState<SigningCosmWasmClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const hasCheckedConnection = useRef(false);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      setError(null);
      setWalletStatus('loading');

      const { address, client } = await connectKeplr();
      setAddress(address);
      setClient(client);
      setWalletStatus('success');
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setWalletStatus('error');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectKeplr();
    setAddress(null);
    setClient(null);
    setError(null);
    setWalletStatus('loading');
  }, []);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (hasCheckedConnection.current) return;
      hasCheckedConnection.current = true;
      
      try {
        const savedAddress = await getKeplrAddress();
        if (savedAddress && !address) {
          await connect();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    checkConnection();
  }, [connect]);

  const value = React.useMemo(() => ({
    address,
    client,
    isConnecting,
    error,
    walletStatus,
    connect,
    disconnect,
  }), [address, client, isConnecting, error, walletStatus, connect, disconnect]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 