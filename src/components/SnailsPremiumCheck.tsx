import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import styles from '../styles/SnailsPremium.module.css';

const SNAILS_DAO = 'stars13hvkmnj6m4fe24uzegme0l7whvtvxnzlgjc98j3lednyvpksrfaqg2gqjm';
const SNAILS_COLLECTION = 'stars1qur5x273yhdn2lgz49e62lfp6tsthyku6jjw953gl3r7df2azmcshfq8gt';

interface SnailsPremiumCheckProps {
  onStatusChange: (isPremium: boolean) => void;
}

export const SnailsPremiumCheck: React.FC<SnailsPremiumCheckProps> = ({ onStatusChange }) => {
  const { address, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        setIsPremium(false);
        return;
      }

      try {
        // Check NFT holdings using GraphQL
        const holdingsResponse = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query CheckHoldings($address: String!, $collection: String!) {
                nftHoldings(holderAddr: $address, collectionAddr: $collection) {
                  total
                }
              }
            `,
            variables: {
              address,
              collection: SNAILS_COLLECTION
            }
          })
        });
        
        const holdingsData = await holdingsResponse.json();
        const hasNFTs = holdingsData?.data?.nftHoldings?.total > 0;

        // Check DAO staking using GraphQL
        const stakingResponse = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query CheckStaking($address: String!, $dao: String!) {
                daoStaking(stakerAddr: $address, daoAddr: $dao) {
                  amount
                }
              }
            `,
            variables: {
              address,
              dao: SNAILS_DAO
            }
          })
        });
        
        const stakingData = await stakingResponse.json();
        const isStaking = stakingData?.data?.daoStaking?.amount > 0;

        setIsPremium(hasNFTs || isStaking);
        onStatusChange(hasNFTs || isStaking);
      } catch (err) {
        setError('Failed to check premium status');
        console.error('Error checking premium status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [address, isConnected, onStatusChange]);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.message}>
          Connect your wallet to check premium status
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Checking premium status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        {isPremium ? (
          <>
            <span className={styles.premiumBadge}>⭐ Premium Member</span>
            <p className={styles.description}>
              You have access to all premium features as a SNAILS holder/staker
            </p>
          </>
        ) : (
          <>
            <span className={styles.standardBadge}>Standard Member</span>
            <p className={styles.description}>
              Hold or stake SNAILS to unlock premium features
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SnailsPremiumCheck; 