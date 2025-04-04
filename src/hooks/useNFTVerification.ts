import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGun } from '../contexts/GunContext';

const SNAILS_COLLECTION_ADDRESS = 'stars1jkee98qm7flr78kr0f5j7des35v83cdrp9l92ye0lpffeyh5n7xsu0vz49';

export const useNFTVerification = () => {
  const { client, address } = useWallet();
  const { gun } = useGun();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyNFTHolder = async () => {
      if (!client || !address || !gun) return;

      try {
        setLoading(true);
        setError(null);

        // Query the NFT contract for token ownership
        const response = await client.queryContractSmart(SNAILS_COLLECTION_ADDRESS, {
          tokens: { owner: address }
        });

        const hasNFTs = response.tokens && response.tokens.length > 0;

        // Update Gun database with verification status
        if (hasNFTs) {
          const userRef = gun.get('users').get(address);
          userRef.put({
            isVerifiedHolder: true,
            snailsNFTs: response.tokens
          });
        }

        setIsVerified(hasNFTs);
      } catch (err) {
        console.error('Error verifying NFT holder status:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify NFT holder status');
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyNFTHolder();
  }, [client, address, gun]);

  return { isVerified, loading, error };
}; 