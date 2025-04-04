import React, { useState, useEffect } from 'react';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { useWallet } from '../contexts/WalletContext';
import styles from './ContentPage.module.css';
import CustomVideoPlayer from './CustomVideoPlayer';

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

interface ContentPageProps {
  title: string;
  subtitle: string;
  defaultCategory: string;
}

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

const tags = [
  'Smart Contracts',
  'IBC',
  'Staking',
  'Governance',
  'DeFi',
  'NFTs',
  'Gaming',
  'Privacy',
  'Infrastructure',
  'Tools'
];

const ContentPage: React.FC<ContentPageProps> = ({
  title,
  subtitle,
  defaultCategory
}) => {
  const { client, address } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [collectionsInfo, setCollectionsInfo] = useState<Record<string, CollectionInfo>>({});
  const [loading, setLoading] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([defaultCategory]);
  const [isMinting, setIsMinting] = useState<Record<string, boolean>>({});
  const [txHash, setTxHash] = useState<Record<string, string | null>>({});

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

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

  const handleInfoClick = (address: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `/video/${address}`;
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.controls')) {
      e.stopPropagation();
    }
  };

  useEffect(() => {
    fetchCollectionInfo();
  }, [client]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const fadeStart = 100;
      const fadeEnd = 400;
      
      if (scrollPosition <= fadeStart) {
        setOpacity(1);
      } else if (scrollPosition >= fadeEnd) {
        setOpacity(0);
      } else {
        const fadeRange = fadeEnd - fadeStart;
        const fadeAmount = (fadeEnd - scrollPosition) / fadeRange;
        setOpacity(Math.max(0, Math.min(1, fadeAmount)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className={styles.hero}>
      <video
        className={styles.backgroundVideo}
        src="/videos/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className={styles.wrapper} style={{ opacity, transition: 'opacity 0.3s ease-out' }}>
        <div className={styles.content}>
          <div className={styles.titleGroup}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search educational content..."
                value={searchTerm}
                onChange={handleSearch}
                className={styles.searchInput}
              />
              <div className={styles.tags}>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagSelected : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.mascotWrapper}>
          <img 
            src="/images/Dail.webp" 
            alt="Dail" 
            className={styles.mascot}
          />
        </div>
      </div>

      <div className={styles.videoList}>
        {loading ? (
          <div className={styles.loadingContainer}>Loading collections...</div>
        ) : error ? (
          <div className={styles.errorContainer}>{error}</div>
        ) : (
          Object.entries(collectionsInfo).map(([address, info]) => (
            <div key={address} className={styles.videoCard}>
              <div className={styles.thumbnailContainer} onClick={handleVideoClick}>
                <CustomVideoPlayer 
                  src="/videos/background.mp4"
                  poster="/videos/background.mp4"
                  isPreview={false}
                />
              </div>
              <div className={styles.videoInfo} onClick={handleInfoClick(address)}>
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
                </div>
                <button 
                  className={styles.mintButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMint(address, COLLECTIONS.find(c => c.address === address)?.minter || '');
                  }}
                  disabled={isMinting[address] || !address}
                >
                  {getMintButtonText(address)}
                </button>
              </div>
            </div>
          ))
        )}

        {error && <div className={styles.error}>{error}</div>}
        {Object.entries(txHash).map(([address, hash]) => (
          hash && (
            <div key={address} className={styles.success}>
              Successfully minted! View transaction{' '}
              <a
                href={`https://www.mintscan.io/stargaze/txs/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                here
              </a>
            </div>
          )
        ))}
      </div>
    </section>
  );
};

export default ContentPage; 