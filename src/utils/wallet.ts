import { Window as KeplrWindow } from "@keplr-wallet/types";
import { SigningStargateClient } from "@cosmjs/stargate";

declare global {
  interface Window extends KeplrWindow {}
}

const CHAIN_ID = "stargaze-1";

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

    // Create a Stargate client
    const rpcEndpoint = "https://rpc.stargaze-apis.com/";
    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner
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