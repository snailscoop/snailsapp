import React, { createContext, useContext, useState, useEffect } from 'react';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { connectKeplr, disconnectKeplr, getKeplrAddress } from '../utils/wallet';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  client: CosmWasmClient | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  client: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<CosmWasmClient | null>(null);

  useEffect(() => {
    const initClient = async () => {
      if (isConnected) {
        try {
          const newClient = await CosmWasmClient.connect('https://rpc.stargaze-apis.com');
          setClient(newClient);
        } catch (error) {
          console.error('Failed to initialize CosmWasm client:', error);
        }
      } else {
        setClient(null);
      }
    };

    initClient();
  }, [isConnected]);

  const connect = async () => {
    try {
      const { address: newAddress, client: newClient } = await connectKeplr();
      setAddress(newAddress);
      setClient(newClient);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    disconnectKeplr();
    setAddress(null);
    setClient(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect, client }}>
      {children}
    </WalletContext.Provider>
  );
}; 