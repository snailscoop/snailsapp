import { Window as KeplrWindow } from "@keplr-wallet/types";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { StdSignature } from "@keplr-wallet/types";
import { OfflineSigner } from '@cosmjs/proto-signing';

declare global {
  interface Window extends KeplrWindow {}
}

const CHAIN_ID = "stargaze-1";
const RPC_ENDPOINT = "https://rpc.stargaze-apis.com/";
const DEFAULT_GAS_PRICE = GasPrice.fromString('0.05ustars');

interface PermitSignature {
  pub_key: {
    type: string;
    value: string;
  };
  signature: string;
}

interface Permit {
  params: {
    permit_name: string;
    allowed_tokens: string[];
    chain_id: string;
    permissions: string[];
  };
  signature: PermitSignature;
}

export async function signUsernamePermit(
  username: string,
  address: string
): Promise<{
  signature: string;
  pub_key: { type: string; value: string };
  permit: {
    permit_name: string;
    allowed_tokens: string[];
    permissions: string[];
  };
}> {
  if (!window.keplr) {
    throw new Error('Keplr wallet not found');
  }

  const permit = {
    permit_name: 'username_verification',
    allowed_tokens: [],
    permissions: ['owner']
  };

  const message = JSON.stringify({
    username,
    timestamp: Date.now(),
    permit
  });

  const { signature, pub_key } = await window.keplr.signArbitrary(
    CHAIN_ID,
    address,
    message
  );

  return {
    signature,
    pub_key: {
      type: 'tendermint/PubKeySecp256k1',
      value: pub_key
    },
    permit
  };
}

export const connectKeplr = async () => {
  try {
    // Check if Keplr is installed
    if (!window.keplr) {
      throw new Error("Please install Keplr extension");
    }

    // Enable the chain
    await window.keplr.enable(CHAIN_ID);

    // Get the offline signer
    const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);

    // Get the user's account
    const accounts = await offlineSigner.getAccounts();
    const address = accounts[0].address;

    // Create a CosmWasm client
    const client = await SigningCosmWasmClient.connectWithSigner(
      RPC_ENDPOINT,
      offlineSigner,
      { gasPrice: DEFAULT_GAS_PRICE }
    );

    return {
      address,
      client,
      offlineSigner,
    };
  } catch (error) {
    console.error("Error connecting to Keplr:", error);
    throw error;
  }
};

export const disconnectKeplr = () => {
  // Currently, Keplr doesn't provide a direct disconnect method
  // We can clear our local state instead
  return true;
};

export const getKeplrAddress = async (): Promise<string | null> => {
  try {
    if (!window.keplr) return null;
    await window.keplr.enable(CHAIN_ID);
    const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
    const accounts = await offlineSigner.getAccounts();
    return accounts[0].address;
  } catch (error) {
    console.error("Error getting Keplr address:", error);
    return null;
  }
}; 