import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { connectKeplr, disconnectKeplr, getKeplrAddress } from '../utils/wallet';

interface WalletContextType {
  address: string | null;
  client: SigningStargateClient | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  client: null,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const { address, client } = await connectKeplr();
      setAddress(address);
      setClient(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectKeplr();
    setAddress(null);
    setClient(null);
    setError(null);
  }, []);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      const address = await getKeplrAddress();
      if (address) {
        connect();
      }
    };
    checkConnection();
  }, [connect]);

  return (
    <WalletContext.Provider
      value={{
        address,
        client,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 