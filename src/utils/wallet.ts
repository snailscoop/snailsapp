import { Window as KeplrWindow } from "@keplr-wallet/types";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { toBase64 } from "@cosmjs/encoding";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { permitCache } from './permitCache';

declare global {
  interface Window extends KeplrWindow {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => Promise<OfflineSigner>;
      sendTokens: (fromAddress: string, toAddress: string, amount: { denom: string; amount: string }[], memo?: string) => Promise<{ transactionHash: string }>;
      signArbitrary: (chainId: string, address: string, data: string) => Promise<{ signature: string; pub_key: string }>;
      disable: () => void;
    };
  }
}

const CHAIN_ID = "stargaze-1";
const RPC_ENDPOINT = "https://rpc.stargaze-apis.com/";
const DEFAULT_GAS_PRICE = GasPrice.fromString('0.05ustars');

export interface Permit {
  permit: {
    params: {
      permit_name: string;
      chain_id: string;
      allowed_tokens: string[];
    };
    signature: string;
  };
  signature: string;
}

export const PERMIT_TYPES = {
  USERNAME: 'username_update',
  COMMENT: 'comment',
  MESSAGE: 'direct_message',
  PROFILE: 'profile_update',
  REACTION: 'reaction'
} as const;

export const signGunPermit = async (
  address: string,
  type: keyof typeof PERMIT_TYPES,
  data: any
): Promise<Permit> => {
  // Check cache first
  const cachedPermit = permitCache.getPermit(address, type);
  if (cachedPermit) {
    return cachedPermit;
  }

  const { keplr } = window;
  if (!keplr) throw new Error('Keplr not found');

  const chainId = 'stargaze-1';
  const message = JSON.stringify({ type: PERMIT_TYPES[type], data });

  const signResponse = await keplr.signArbitrary(chainId, address, message);

  const permit = {
    params: {
      permit_name: PERMIT_TYPES[type],
      chain_id: chainId,
      allowed_tokens: []
    },
    signature: signResponse.signature
  };

  const result = {
    permit,
    signature: signResponse.signature
  };

  // Cache the permit
  permitCache.setPermit(address, type, result);

  return result;
};

export const signUsernamePermit = async (username: string, address: string): Promise<Permit> => {
  const { keplr } = window;
  if (!keplr) throw new Error('Keplr not found');

  const chainId = 'stargaze-1';
  const message = `Set username to: ${username}`;

  const signResponse = await keplr.signArbitrary(chainId, address, message);

  const permit = {
    params: {
      permit_name: 'username_update',
      chain_id: chainId,
      allowed_tokens: []
    },
    signature: signResponse.signature
  };

  return {
    permit,
    signature: signResponse.signature
  };
};

export const signCommentPermit = async (videoId: string, comment: string, address: string): Promise<Permit> => {
  const { keplr } = window;
  if (!keplr) throw new Error('Keplr not found');

  const chainId = 'stargaze-1';
  const message = `Comment on video ${videoId}: ${comment}`;

  const signResponse = await keplr.signArbitrary(chainId, address, message);

  const permit = {
    params: {
      permit_name: `comment_${videoId}`,
      chain_id: chainId,
      allowed_tokens: []
    },
    signature: signResponse.signature
  };

  return {
    permit,
    signature: signResponse.signature
  };
};

export const connectKeplr = async (): Promise<{ address: string; client: SigningCosmWasmClient }> => {
  if (!window.keplr) {
    throw new Error('Keplr wallet not found');
  }

  try {
    // Request connection to Stargaze chain
    await window.keplr.enable(CHAIN_ID);

    // Get the offline signer
    const offlineSigner = await window.keplr.getOfflineSigner(CHAIN_ID);

    // Initialize the CosmWasm client
    const client = await SigningCosmWasmClient.connectWithSigner(
      RPC_ENDPOINT,
      offlineSigner
    );

    // Get the user's address
    const accounts = await offlineSigner.getAccounts();
    const address = accounts[0].address;

    return { address, client };
  } catch (error) {
    console.error('Failed to connect to Keplr:', error);
    throw error;
  }
};

export const disconnectKeplr = () => {
  // Keplr doesn't have a disconnect method, so we just clear the local state
  window.keplr?.disable();
};

export const getKeplrAddress = async (): Promise<string> => {
  if (!window.keplr) {
    throw new Error('Keplr wallet not found');
  }

  try {
    const offlineSigner = await window.keplr.getOfflineSigner(CHAIN_ID);
    const accounts = await offlineSigner.getAccounts();
    return accounts[0].address;
  } catch (error) {
    console.error('Failed to get Keplr address:', error);
    throw error;
  }
}; 