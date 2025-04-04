import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import VideoComments from '../components/VideoComments';
import styles from './VideoView.module.css';

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

interface VideoInfo {
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

const VideoView: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { client, address } = useWallet();
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchVideoInfo = async () => {
    if (!client || !videoId) return;

    try {
      setLoading(true);
      setError(null);

      // Find the collection that matches the videoId
      const collection = COLLECTIONS.find(c => c.address === videoId);
      if (!collection) {
        throw new Error('Video not found');
      }

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

      setVideoInfo({
        title: collectionInfo.name || 'Untitled Collection',
        description: collectionInfo.description || 'No description available',
        creator: collectionInfo.creator || 'Unknown Creator',
        category: collectionInfo.category || 'Educational',
        thumbnail: collectionInfo.image?.replace('ipfs://', 'https://ipfs.io/ipfs/'),
        music: collectionInfo.music,
        minted: collectionInfo.num_tokens?.toString() || '0',
        totalSupply: minterConfig.num_tokens?.toString() || '0',
        price: `${priceAmount} ${denom}`
      });
    } catch (err) {
      console.error('Error fetching video info:', err);
      setError('Failed to fetch video information');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!client || !address || !videoId) return;
    
    setIsMinting(true);
    setError(null);
    setTxHash(null);
    
    try {
      const collection = COLLECTIONS.find(c => c.address === videoId);
      if (!collection) {
        throw new Error('Video not found');
      }

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
        collection.minter,
        mintMsg,
        fee,
        '',
        funds
      );

      setTxHash(result.transactionHash);
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError(error instanceof Error ? error.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const getMintButtonText = () => {
    if (isMinting) {
      return 'Minting...';
    }
    if (txHash) {
      return 'Minted!';
    }
    return 'Mint to Support - 2 USDC';
  };

  useEffect(() => {
    fetchVideoInfo();
  }, [client, videoId]);

  if (loading) {
    return <div className={styles.loadingContainer}>Loading video...</div>;
  }

  if (error || !videoInfo) {
    return <div className={styles.errorContainer}>{error || 'Video not found'}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <div className={styles.videoPlayer}>
            <CustomVideoPlayer
              src="/videos/background.mp4"
              poster="/videos/background.mp4"
              isPreview={false}
            />
          </div>
          <div className={styles.videoInfo}>
            <h1>{videoInfo.title}</h1>
            <p className={styles.description}>{videoInfo.description}</p>

            <div className={styles.metadata}>
              <div className={styles.traitRow}>
                <div className={styles.traitField}>
                  <span className={styles.label}>Category:</span>
                  <span className={styles.value}>{videoInfo.category || 'N/A'}</span>
                </div>
                <div className={styles.traitField}>
                  <span className={styles.label}>Creator:</span>
                  <span className={styles.value}>{videoInfo.creator}</span>
                </div>
                <div className={styles.traitField}>
                  <span className={styles.label}>Music:</span>
                  <span className={styles.value}>{videoInfo.music || 'N/A'}</span>
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
                  <span className={styles.label}>Price:</span>
                  <span className={styles.value}>{videoInfo.price || 'N/A'}</span>
                </div>
                <div className={styles.traitField}>
                  <span className={styles.label}>Minted:</span>
                  <span className={styles.value}>{`${videoInfo.minted || '0'}/${videoInfo.totalSupply || '0'}`}</span>
                </div>
              </div>
            </div>

            <button 
              className={styles.mintButton}
              onClick={handleMint}
              disabled={isMinting || !address}
            >
              {getMintButtonText()}
            </button>

            {error && <div className={styles.error}>{error}</div>}
            {txHash && (
              <div className={styles.success}>
                Successfully minted! View transaction{' '}
                <a
                  href={`https://www.mintscan.io/stargaze/txs/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.txLink}
                >
                  here
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.commentsSection}>
          {videoId && <VideoComments videoId={videoId} />}
        </div>
      </div>
    </div>
  );
};

export default VideoView; 