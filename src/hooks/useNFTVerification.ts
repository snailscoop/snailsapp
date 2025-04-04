import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGun } from '../contexts/GunContext';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { STARGAZE_RPC, SNAILS_COLLECTION_ADDRESS } from '../config';

export enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface NFTMetadata {
  tokenId: string;
  image: string;
  name: string;
  description?: string;
}

export const useNFTVerification = () => {
  const { address } = useWallet();
  const { gun } = useGun();
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);

  const fetchNFTMetadata = async (tokenId: string) => {
    try {
      console.log('Fetching metadata for token:', tokenId);
      const client = await SigningCosmWasmClient.connect(STARGAZE_RPC);
      
      const queryMsg = {
        nft_info: {
          token_id: tokenId
        }
      };
      
      const result = await client.queryContractSmart(SNAILS_COLLECTION_ADDRESS, queryMsg);
      console.log('NFT metadata response:', result);

      if (result?.extension?.image) {
        const metadata: NFTMetadata = {
          tokenId,
          image: result.extension.image,
          name: result.extension.name || `SNAILS #${tokenId}`,
          description: result.extension.description
        };
        setNftMetadata(metadata);
        return metadata;
      }
      return null;
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      return null;
    }
  };

  const checkNFTStatus = async (userAddress: string) => {
    try {
      console.log('Starting NFT verification check for address:', userAddress);
      setStatus(Status.LOADING);
      setError(null);

      // Connect to Stargaze RPC
      console.log('Connecting to Stargaze RPC...');
      const client = await SigningCosmWasmClient.connect(STARGAZE_RPC);
      console.log('Connected to Stargaze RPC');

      // Query NFT ownership
      console.log('Querying NFT contract:', SNAILS_COLLECTION_ADDRESS);
      const queryMsg = {
        tokens: {
          owner: userAddress,
          limit: 1
        }
      };
      console.log('Query message:', queryMsg);

      const result = await client.queryContractSmart(SNAILS_COLLECTION_ADDRESS, queryMsg);
      console.log('NFT check raw response:', result);

      // Validate response
      const hasTokens = Array.isArray(result?.tokens) && result.tokens.length > 0;
      console.log('Has SNAILS tokens:', hasTokens);

      // Update verification status
      setIsVerified(hasTokens);
      setStatus(hasTokens ? Status.SUCCESS : Status.ERROR);

      // If we have tokens, fetch the metadata for the first one
      if (hasTokens && result.tokens[0]) {
        await fetchNFTMetadata(result.tokens[0]);
      }

      // Update GunDB
      if (gun) {
        console.log('Updating GunDB with verification status');
        const userRef = gun.get('users').get(userAddress);
        await new Promise<void>((resolve, reject) => {
          userRef.put({
            isVerifiedHolder: hasTokens,
            lastActive: Date.now(),
            nftMetadata: hasTokens ? nftMetadata : null
          }, (ack: any) => {
            if (ack.err) {
              console.error('Error updating GunDB:', ack.err);
              reject(new Error(ack.err));
            } else {
              console.log('Successfully updated GunDB');
              resolve();
            }
          });
        });
      }

      return hasTokens;
    } catch (err) {
      console.error('Error in NFT verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify NFT ownership');
      setStatus(Status.ERROR);
      setIsVerified(false);
      return false;
    }
  };

  useEffect(() => {
    if (!address) {
      console.log('No address available, resetting verification status');
      setStatus(Status.IDLE);
      setIsVerified(false);
      setNftMetadata(null);
      return;
    }

    console.log('Address changed, checking NFT status for:', address);
    checkNFTStatus(address);
  }, [address]);

  return {
    isVerified,
    loading: status === Status.LOADING,
    error,
    status,
    nftMetadata
  };
}; 