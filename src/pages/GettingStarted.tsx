import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Window as KeplrWindow } from '@keplr-wallet/types';
import Modal from 'react-modal';
import styles from './GettingStarted.module.css';
import modalStyles from './MintModal.module.css';

// Extend window type to include Keplr
declare global {
  interface Window extends KeplrWindow {}
}

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

interface CollectionInfo {
  name: string;
  creator: string;
  description: string;
  image?: string;
  external_link?: string;
}

interface TokenInfo {
  token_id: string;
  token_uri: string;
  extension?: {
    image?: string;
    animation_url?: string;
  };
}

interface MinterConfig {
  mint_price: {
    amount: string;
    denom: string;
  };
  num_tokens: number;
}

interface IPFSMetadata {
  name: string;
  image: string;
  animation_url?: string;
  description: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface Video {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  description: string;
  videoUrl: string;
  duration: string;
  category: string;
  minted: number;
  total: number;
  price: {
    amount: string;
    denom: string;
  };
  minterAddress: string;
}

interface MintResult {
  success: boolean;
  quantity?: number;
  transactionHash?: string;
  error?: string;
}

const CONTRACT_ADDRESS = 'stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0';
const RPC_ENDPOINT = 'https://rpc.stargaze-apis.com/';
const CHAIN_ID = 'stargaze-1';

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

const STARGAZE_IMAGE_URL = 'https://i.stargaze-apis.com/TMEDJ5zGo7gfBdsOYuQKOXW_ugBYtWJi68lNO29vo-E/f:jpg/resize:fit:512:::/dpr:2/plain/ipfs://';

// $OM IBC denom on Stargaze mainnet
const OM_IBC_DENOM = 'ibc/3BD86E80E000B52DA57C474A6A44E37F73D34E38A1FA79EE678E08D119FC555B';

const GettingStarted: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mintQuantities, setMintQuantities] = useState<Record<string, number>>({});
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Helper function to fetch IPFS metadata with multiple gateways
  const fetchIPFSMetadata = async (tokenUri: string): Promise<IPFSMetadata> => {
    const maxRetries = 3;
    const ipfsCid = tokenUri.replace('ipfs://', '');
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      for (const gateway of IPFS_GATEWAYS) {
        try {
          console.log(`Fetching IPFS metadata from ${gateway}${ipfsCid}, attempt ${attempt}...`);
          const response = await fetch(`${gateway}${ipfsCid}`);
          if (!response.ok) {
            throw new Error(`IPFS request failed: ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.warn(`IPFS fetch attempt ${attempt} failed at ${gateway}:`, error);
          lastError = error instanceof Error ? error : new Error('Unknown IPFS error');
          if (attempt === maxRetries && gateway === IPFS_GATEWAYS[IPFS_GATEWAYS.length - 1]) {
            throw lastError;
          }
        }
      }
    }
    throw lastError || new Error('Failed to fetch IPFS metadata after multiple attempts');
  };

  // Helper function to get Stargaze's optimized image URL
  const getStargazeImageUrl = (ipfsPath: string | undefined): string => {
    if (!ipfsPath) return '';
    const cid = ipfsPath.replace('ipfs://', '');
    return `${STARGAZE_IMAGE_URL}${cid}`;
  };

  // Helper function to get IPFS URL for video content
  const getIPFSUrl = (ipfsPath: string | undefined): string => {
    if (!ipfsPath) return '';
    const cid = ipfsPath.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${cid}`;
  };

  // Helper function to map denom to display symbol
  const mapDenomToSymbol = (denom: string): string => {
    switch (denom) {
      case OM_IBC_DENOM:
        return '$OM';
      case 'ustars':
        return '$STARS';
      default:
        return denom;
    }
  };

  const handleQuantityChange = (videoId: string, value: string) => {
    const quantity = Math.max(1, parseInt(value) || 1);
    setMintQuantities(prev => ({
      ...prev,
      [videoId]: quantity,
    }));
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        console.log('Connecting to Stargaze blockchain...');
        const client = await CosmWasmClient.connect(RPC_ENDPOINT);

        // Step 1: Fetch collection info
        console.log('Fetching collection info...');
        const collectionInfo = await client.queryContractSmart(CONTRACT_ADDRESS, { 
          collection_info: {} 
        }) as CollectionInfo;
        console.log('Collection info:', collectionInfo);

        // Step 2: Fetch minted count
        console.log('Fetching minted count...');
        const numTokensResponse = await client.queryContractSmart(CONTRACT_ADDRESS, { 
          num_tokens: {} 
        });
        const mintedCount = parseInt(numTokensResponse.count);
        console.log('Minted count:', mintedCount);

        // Step 3: Fetch minter config for total supply and price
        console.log('Fetching minter info...');
        const minterResponse = await client.queryContractSmart(CONTRACT_ADDRESS, {
          minter: {}
        });
        const minterAddress = minterResponse.minter;
        const minterConfig = await client.queryContractSmart(minterAddress, {
          config: {}
        }) as MinterConfig;
        console.log('Minter config:', minterConfig);

        // Format price and denom
        const priceAmount = (parseInt(minterConfig.mint_price.amount) / 1_000_000).toString();
        const denom = mapDenomToSymbol(minterConfig.mint_price.denom);

        // Step 4: Fetch a token's token_uri using all_tokens
        console.log('Fetching token info...');
        const allTokensResponse = await client.queryContractSmart(CONTRACT_ADDRESS, {
          all_tokens: { 
            limit: 1
          }
        });
        
        if (!allTokensResponse.tokens.length) {
          throw new Error('No tokens found in collection');
        }

        const tokenId = allTokensResponse.tokens[0];
        const tokenInfo = await client.queryContractSmart(CONTRACT_ADDRESS, {
          nft_info: { token_id: tokenId }
        }) as TokenInfo;
        console.log('Token info:', tokenInfo);

        // Step 5: Use Stargaze's optimized image URL for the collection image
        const thumbnail = getStargazeImageUrl(collectionInfo.image);

        // Step 6: Fetch IPFS metadata with fallback to collection data
        let ipfsMetadata: IPFSMetadata | null = null;
        let videoUrl = '';
        let category = 'Educational';
        let duration = '00:00';

        try {
          console.log('Fetching IPFS metadata...');
          ipfsMetadata = await fetchIPFSMetadata(tokenInfo.token_uri);
          console.log('IPFS metadata:', ipfsMetadata);

          videoUrl = getIPFSUrl(ipfsMetadata.animation_url);
          const attributes = ipfsMetadata.attributes || [];
          category = attributes.find(attr => attr.trait_type.toLowerCase() === 'category')?.value || 'Educational';
          duration = attributes.find(attr => attr.trait_type.toLowerCase() === 'duration')?.value || '00:00';
        } catch (err) {
          console.warn('Failed to fetch token IPFS metadata, using collection data:', err);
        }

        const fetchedVideos = [
          {
            id: tokenId,
            title: collectionInfo.name,
            creator: collectionInfo.creator,
            thumbnail,
            description: ipfsMetadata?.description || collectionInfo.description,
            videoUrl,
            duration,
            category,
            minted: mintedCount,
            total: minterConfig.num_tokens,
            price: {
              amount: priceAmount,
              denom
            },
            minterAddress
          },
        ];
        
        console.log('Setting videos:', fetchedVideos);
        setVideos(fetchedVideos);
        // Initialize mint quantities
        const initialQuantities = fetchedVideos.reduce((acc, video) => {
          acc[video.id] = 1;
          return acc;
        }, {} as Record<string, number>);
        setMintQuantities(initialQuantities);
        setError(null);
      } catch (error) {
        console.error('Error fetching videos:', error);
        let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Add context to common errors
        if (errorMessage.includes('minter')) {
          errorMessage = 'Failed to fetch minting information. The collection may not be mintable.';
        } else if (errorMessage.includes('IPFS')) {
          errorMessage = 'Failed to load media content. Please try again later.';
        } else if (errorMessage.includes('all_tokens')) {
          errorMessage = 'Failed to fetch token information. The collection may be empty.';
        }
        
        setError(`Error loading content: ${errorMessage}. Please try again later or contact support if the issue persists.`);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const mintNFT = async (video: Video) => {
    try {
      if (!window.keplr) {
        throw new Error('Please install Keplr wallet to mint NFTs');
      }

      await window.keplr.enable(CHAIN_ID);
      const offlineSigner = await window.keplr.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      const userAddress = accounts[0].address;

      // Store wallet address for profile link
      setWalletAddress(userAddress);

      const client = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        offlineSigner
      );

      const quantity = mintQuantities[video.id] || 1;
      const totalAmount = (parseFloat(video.price.amount) * quantity * 1_000_000).toString();

      const mintMsg = {
        mint: {
          quantity: quantity
        }
      };

      try {
        const result = await client.execute(
          userAddress,
          video.minterAddress,
          mintMsg,
          "auto",
          "",
          [{
            denom: OM_IBC_DENOM,
            amount: totalAmount
          }]
        );

        console.log('Mint transaction result:', result);
        setMintResult({
          success: true,
          quantity,
          transactionHash: result.transactionHash
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error('Mint transaction failed:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to execute mint transaction');
      }
    } catch (error) {
      console.error('Minting error:', error);
      setMintResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMintResult(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div>Loading collection data from Stargaze blockchain...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div>
            <p>Error loading content:</p>
            <p>{error}</p>
            <p>Please try again later or contact support if the issue persists.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Getting Started Content</h1>
      <p className={styles.subtitle}>
        Educational videos to help you navigate the Cosmos ecosystem
      </p>
      <p className={styles.subtitle}>
        Support SNAILS by collecting educational content
      </p>
      <div className={styles.videoList}>
        {videos.map(video => (
          <div key={video.id} className={styles.videoCard}>
            <div className={styles.thumbnailContainer}>
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className={styles.thumbnail}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/images/placeholder-thumbnail.jpg';
                }}
              />
              <span className={styles.duration}>{video.duration}</span>
              <svg className={styles.playIcon} viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className={styles.videoInfo}>
              <Link to={`/collection/${video.id}`} className={styles.videoTitle}>
                {video.title}
              </Link>
              <p className={styles.creator}>{video.creator}</p>
              <p className={styles.description}>{video.description}</p>
              <p className={styles.tag}>{video.category}</p>
              <p className={styles.price}>{video.price.amount} {video.price.denom}</p>
              <p className={styles.mintCount}>
                {video.minted} / {video.total} minted
              </p>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => window.open(video.videoUrl, '_blank')}
                  className={styles.playButton}
                  disabled={!video.videoUrl}
                >
                  Play
                </button>
                <input
                  type="number"
                  min="1"
                  value={mintQuantities[video.id] || 1}
                  onChange={(e) => handleQuantityChange(video.id, e.target.value)}
                  className={styles.quantityInput}
                />
                <button
                  onClick={() => mintNFT(video)}
                  className={styles.mintButton}
                >
                  Mint to Support
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className={modalStyles.modalContent}
        overlayClassName={modalStyles.modalOverlay}
      >
        {mintResult?.success ? (
          <div>
            <h2 className={modalStyles.successTitle}>
              It fucking worked 🐌💨
            </h2>
            <p className={modalStyles.message}>
              You minted {mintResult.quantity} NFT(s)!
            </p>
            <p className={modalStyles.hash}>
              Transaction Hash: {mintResult.transactionHash}
            </p>
            <div className={modalStyles.imageContainer}>
              <img
                src="/images/SNAILS.StickerPePe.png"
                alt="Pepe Snail"
                className={modalStyles.snailImage}
              />
              <div className={modalStyles.smokeContainer}>
                <div className={modalStyles.puff1} />
                <div className={modalStyles.puff2} />
                <div className={modalStyles.puff3} />
              </div>
            </div>
            <div className={modalStyles.buttonContainer}>
              <button
                onClick={() => window.open(`https://www.stargaze.zone/p/${walletAddress}/tokens?from=wallet`, '_blank')}
                className={modalStyles.profileButton}
              >
                View Stargaze Profile
              </button>
              <button
                onClick={closeModal}
                className={modalStyles.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className={modalStyles.failureTitle}>
              Shit it failed! 💥
            </h2>
            <p className={modalStyles.message}>
              Something went wrong...
            </p>
            <p className={modalStyles.hash}>
              Error: {mintResult?.error}
            </p>
            <div className={modalStyles.imageContainer}>
              <img
                src="/images/SNAILS.Explosive.png"
                alt="Explosive Snail"
                className={modalStyles.explosiveSnail}
              />
              <div className={modalStyles.explosionContainer}>
                <div className={modalStyles.particle1} />
                <div className={modalStyles.particle2} />
                <div className={modalStyles.particle3} />
                <div className={modalStyles.particle4} />
              </div>
            </div>
            <div className={modalStyles.buttonContainer}>
              <button
                onClick={closeModal}
                className={modalStyles.failureButton}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GettingStarted; 