import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import styles from './GettingStarted.module.css';

const OM_IBC_DENOM = 'ibc/3BD86E80E000B52DA57C474A6A44E37F73D34E38A1FA79EE678E08D119FC555B';

const COLLECTIONS = [
  {
    address: 'stars1jkee98qm7flr78kr0f5j7des35v83cdrp9l92ye0lpffeyh5n7xsu0vz49',
    minter: 'stars1p38a3yepjs02en6j96pemx3gwwjzlnmskc6cn0gjhw3wfneq4jts3flup4'
  },
  {
    address: 'stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0',
    minter: 'stars1p38a3yepjs02en6j96pemx3gwwjzlnmskc6cn0gjhw3wfneq4jts3flup4'
  }
];

interface CollectionInfo {
  title: string;
  description: string;
  creator: string;
  category?: string;
  thumbnail?: string;
  music?: string;
  minted?: string;
  totalSupply?: string;
  price?: string;
}

const GettingStarted: React.FC = () => {
  const navigate = useNavigate();
  const { client, address } = useWallet();
  const [collectionsInfo, setCollectionsInfo] = useState<Record<string, CollectionInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinting, setIsMinting] = useState<Record<string, boolean>>({});
  const [txHash, setTxHash] = useState<Record<string, string | null>>({});

  const fetchCollectionInfo = async () => {
    if (!client) return;

    try {
      setLoading(true);
      setError(null);

      const collectionsData: Record<string, CollectionInfo> = {};

      for (const collection of COLLECTIONS) {
        try {
          // Get collection info
          const collectionInfo = await client.queryContractSmart(collection.address, {
            collection_info: {}
          });

          // Get minter info
          const minterResponse = await client.queryContractSmart(collection.address, {
            minter: {}
          });

          // Get minter config from minter contract
          const minterConfig = await client.queryContractSmart(minterResponse.minter, {
            mint_price: {}
          });

          // Format price for display
          const priceAmount = (parseInt(minterConfig.amount) / 1_000_000).toString();
          const denom = minterConfig.denom === OM_IBC_DENOM ? '$OM' : 'STARS';

          collectionsData[collection.address] = {
            title: collectionInfo.name || 'Untitled Collection',
            description: collectionInfo.description || 'No description available',
            creator: collectionInfo.creator || 'Unknown Creator',
            category: collectionInfo.category || 'Educational',
            thumbnail: collectionInfo.image?.replace('ipfs://', 'https://ipfs.io/ipfs/'),
            music: collectionInfo.music,
            minted: collectionInfo.num_tokens?.toString() || '0',
            totalSupply: minterConfig.num_tokens?.toString() || '0',
            price: `${priceAmount} ${denom}`
          };
        } catch (err) {
          console.error(`Error fetching collection info for ${collection.address}:`, err);
        }
      }

      setCollectionsInfo(collectionsData);
    } catch (err) {
      console.error('Error fetching collections info:', err);
      setError('Failed to fetch collection information');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async (collectionAddress: string, minterAddress: string) => {
    if (!client || !address) return;
    
    setIsMinting(prev => ({ ...prev, [collectionAddress]: true }));
    setError(null);
    setTxHash(prev => ({ ...prev, [collectionAddress]: null }));
    
    try {
      const mintMsg = { mint: {} };
      const funds = [{
        denom: OM_IBC_DENOM,
        amount: '500000'
      }];

      const fee = {
        amount: [{ denom: 'ustars', amount: '0' }],
        gas: '5000000',
      };

      const result = await client.execute(
        address,
        minterAddress,
        mintMsg,
        fee,
        '',
        funds
      );

      setTxHash(prev => ({ ...prev, [collectionAddress]: result.transactionHash }));
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError(error instanceof Error ? error.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(prev => ({ ...prev, [collectionAddress]: false }));
    }
  };

  const getMintButtonText = (address: string) => {
    if (isMinting[address]) {
      return 'Minting...';
    }
    if (txHash[address]) {
      return 'Minted!';
    }
    return 'Mint to Support - 2 USDC';
  };

  const handleViewVideo = (address: string) => {
    navigate(`/video/${address}`);
  };

  useEffect(() => {
    fetchCollectionInfo();
  }, [client]);

  return (
    <div className={styles.container}>
      <h1>Getting Started</h1>
      <p>Begin your journey into the world of Web3 and blockchain</p>

      {loading ? (
        <div className={styles.loadingContainer}>Loading collections...</div>
      ) : error ? (
        <div className={styles.errorContainer}>{error}</div>
      ) : (
        Object.entries(collectionsInfo).map(([address, info]) => (
          <div key={address} className={styles.videoCard}>
            <div className={styles.thumbnailContainer}>
              <CustomVideoPlayer 
                src="/videos/background.mp4"
                poster="/videos/background.mp4"
                isPreview={true}
              />
            </div>
            <div className={styles.videoInfo}>
              <h2>{info.title}</h2>
              <p>{info.description}</p>
              <div className={styles.metadata}>
                <div className={styles.traitRow}>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Category:</span>
                    <span className={styles.value}>{info.category || 'N/A'}</span>
                  </div>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Creator:</span>
                    <span className={styles.value}>{info.creator}</span>
                  </div>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Music:</span>
                    <span className={styles.value}>{info.music || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.traitRow}>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Network:</span>
                    <span className={styles.value}>Stargaze</span>
                  </div>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Topic:</span>
                    <span className={styles.value}>Educational</span>
                  </div>
                </div>
                <div className={styles.traitRow}>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Minted:</span>
                    <span className={styles.value}>{info.minted} / {info.totalSupply}</span>
                  </div>
                  <div className={styles.traitField}>
                    <span className={styles.label}>Price:</span>
                    <span className={styles.value}>{info.price}</span>
                  </div>
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.watchButton}
                  onClick={() => handleViewVideo(address)}
                >
                  Watch Video
                </button>
                <button 
                  className={`${styles.mintButton} ${txHash[address] ? styles.minted : ''}`}
                  onClick={() => handleMint(address, COLLECTIONS.find(c => c.address === address)?.minter || '')}
                  disabled={isMinting[address] || !!txHash[address]}
                >
                  {getMintButtonText(address)}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GettingStarted;