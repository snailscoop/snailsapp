export const connectWallet = async () => {
  // Mock implementation for connecting wallet
  return {
    getAccounts: async () => [{ address: 'mock-address' }],
  };
};

export const registerVideo = async (client: any, senderAddress: string, tokenId: string, metadataHash: string) => {
  // Mock implementation for registering a video
  console.log(`Registering video with tokenId: ${tokenId}, metadataHash: ${metadataHash}`);
}; 