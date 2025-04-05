import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import styles from './PremiumStatus.module.css';

interface NFTToken {
  tokenId: string;
  imageUrl: string;
}

const SNAILS_COLLECTION = 'stars1uv4dz7ngaqwymv2c1xj8v73d0vsk07yu6wg5gn9';
const SNAILS_DAO = 'stars1...'; // Replace with actual DAO address
const CONSTELLATIONS_API = 'https://constellations-api.mainnet.stargaze-apis.com/graphql';

export const PremiumStatus: React.FC<{ onStatusChange: (status: boolean) => void }> = ({ onStatusChange }) => {
  const { address, client } = useWallet();
  const [isHolder, setIsHolder] = useState(false);
  const [isStaker, setIsStaker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownedTokens, setOwnedTokens] = useState<NFTToken[]>([]);
  const [stakedTokens, setStakedTokens] = useState<NFTToken[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTToken | null>(null);
  const [votingPower, setVotingPower] = useState<string>('0');

  useEffect(() => {
    const checkStatus = async () => {
      if (!address || !client) {
        setLoading(false);
        setError('Please connect your wallet');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check NFT ownership via Constellations GraphQL API
        const nftResponse = await fetch(CONSTELLATIONS_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SNAILS-Webapp <support@snails.app>'
          },
          body: JSON.stringify({
            query: `
              query Tokens($collectionAddr: String!, $ownerAddr: String!) {
                tokens(filterByCollectionAddrs: [$collectionAddr], ownerAddr: $ownerAddr) {
                  tokens {
                    collectionAddr
                    tokenId
                    ownerAddr
                  }
                }
              }
            `,
            variables: {
              collectionAddr: SNAILS_COLLECTION,
              ownerAddr: address
            }
          })
        });

        const nftData = await nftResponse.json();
        console.log('Constellations response:', nftData);

        if (nftData.errors) {
          throw new Error(nftData.errors[0].message);
        }

        const tokens = (nftData.data?.tokens?.tokens || []).map((token: any) => ({
          tokenId: token.tokenId,
          imageUrl: `https://ipfs.io/ipfs/bafybeigzqgcqmxqhboe2oyhh4qybmhr5nqjrvmdsqvsycnh4g7mi2qzwwi/${token.tokenId}.png`
        }));

        console.log('Processed tokens:', tokens);
        setOwnedTokens(tokens);
        setIsHolder(tokens.length > 0);

        // Check DAO staking status
        const votingPowerQuery = {
          voting_power: {
            address: address
          }
        };

        const votingPowerResponse = await client.queryContractSmart(SNAILS_DAO, votingPowerQuery);
        const power = votingPowerResponse.voting_power || '0';
        setVotingPower(power);
        setIsStaker(parseInt(power) > 0);

        // If staked, fetch staked NFT details
        if (parseInt(power) > 0) {
          // Add logic to fetch staked NFT details
          // This would depend on your DAO's specific implementation
          setStakedTokens([]);
        }

        const isPremium = tokens.length > 0 || parseInt(power) > 0;
        onStatusChange(isPremium);

      } catch (err) {
        console.error('Error checking status:', err);
        setError('Failed to check status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [address, client, onStatusChange]);

  if (loading) {
    return <div className={styles.loading}>Checking status...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.premiumStatus}>
      <h3>Premium Status</h3>
      
      <div className={styles.statusGrid}>
        <div className={`${styles.statusItem} ${isHolder ? styles.active : ''}`}>
          <div className={styles.statusHeader}>
            <span className={styles.statusIcon}>🐌</span>
            <span className={styles.statusTitle}>SNAILS NFT Holder</span>
          </div>
          <div className={styles.details}>
            <p>Owned NFTs: {ownedTokens.length}</p>
            {!isHolder && (
              <p className={styles.requirement}>
                You need to own at least 1 SNAILS NFT for premium access
              </p>
            )}
          </div>
          {ownedTokens.length > 0 && (
            <div className={styles.nftGrid}>
              {ownedTokens.map((token) => (
                <div 
                  key={token.tokenId} 
                  className={styles.nftItem}
                  onClick={() => setSelectedNFT(token)}
                >
                  <img src={token.imageUrl} alt={`SNAILS #${token.tokenId}`} />
                  <span>#{token.tokenId}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.statusItem} ${isStaker ? styles.active : ''}`}>
          <div className={styles.statusHeader}>
            <span className={styles.statusIcon}>⚡</span>
            <span className={styles.statusTitle}>DAO Staker</span>
          </div>
          <div className={styles.details}>
            <p>Voting Power: {votingPower}</p>
            {!isStaker && (
              <p className={styles.requirement}>
                Stake in the SNAILS DAO for premium access
              </p>
            )}
          </div>
          {stakedTokens.length > 0 && (
            <div className={styles.nftGrid}>
              {stakedTokens.map((token) => (
                <div 
                  key={token.tokenId} 
                  className={styles.nftItem}
                  onClick={() => setSelectedNFT(token)}
                >
                  <img src={token.imageUrl} alt={`Staked NFT #${token.tokenId}`} />
                  <span>#{token.tokenId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedNFT && (
        <div className={styles.modal} onClick={() => setSelectedNFT(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedNFT.imageUrl} alt={`SNAILS #${selectedNFT.tokenId}`} />
            <h4>SNAILS #{selectedNFT.tokenId}</h4>
            <button onClick={() => setSelectedNFT(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}; 