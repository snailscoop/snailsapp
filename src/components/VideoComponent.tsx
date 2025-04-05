import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { SigningStargateClient } from '@cosmjs/stargate';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { Window as KeplrWindow } from "@keplr-wallet/types";
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import styles from './VideoComponent.module.css';
import { viewVideo, logWatchTime, likeVideo, dislikeVideo, getViews, getLikes, getDislikes } from '../services/algorithm';
import { connectWallet, registerVideo } from '../services/stargaze';
import FeedbackPopup from './FeedbackPopup';

interface FeedbackPopupProps {
  tokenId: string;
  userId: string;
  onClose: () => void;
}

declare global {
  interface Window extends KeplrWindow {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => Promise<OfflineSigner>;
      sendTokens: (fromAddress: string, toAddress: string, amount: { denom: string; amount: string }[], memo?: string) => Promise<{ transactionHash: string }>;
      signArbitrary: (chainId: string, address: string, data: string) => Promise<{ signature: string; pub_key: string }>;
    };
  }
}

interface VideoComponentProps {
  tokenId: string;
  ipfsLink: string;
  title?: string;
  description?: string;
  creator?: string;
  music?: string;
  category?: string;
  topic?: string;
  mintNumber?: string;
  price?: string;
}

const VideoComponent: React.FC<VideoComponentProps> = ({
  tokenId,
  ipfsLink,
  title,
  description,
  creator,
  music,
  category,
  topic,
  mintNumber,
  price
}) => {
  const { address, client } = useWallet();
  const navigate = useNavigate();
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const videoRef = useRef(null);
  const startTimeRef = useRef<number | null>(null);
  const userId = 'user1'; // Placeholder, replace with real user ID later
  
  // Convert IPFS link to HTTP URL for video source
  const videoUrl = ipfsLink.replace('ipfs://', 'https://ipfs.io/ipfs/');

  useEffect(() => {
    const fetchStats = async () => {
      setViews(await getViews(tokenId));
      setLikes(await getLikes(tokenId));
      setDislikes(await getDislikes(tokenId));
    };
    fetchStats();
    viewVideo(tokenId); // Log view on load
  }, [tokenId]);

  const handlePlay = () => {
    startTimeRef.current = Date.now() / 1000;
  };

  const handlePauseOrEnd = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor(Date.now() / 1000 - startTimeRef.current);
      logWatchTime(tokenId, userId, elapsed);
      startTimeRef.current = null;
    }
  };

  const handleDislike = () => {
    dislikeVideo(tokenId, userId);
    setDislikes((prev) => prev + 1);
    setShowFeedback(true);
  };

  const handleViewVideo = () => {
    navigate(`/video/${tokenId}`);
  };

  const handleTipSnails = async () => {
    if (!window.keplr || !client || !address) {
      alert('Please connect your Keplr wallet');
      return;
    }

    try {
      await window.keplr.enable('osmosis-1');
      const signer = await window.keplr.getOfflineSigner('osmosis-1');
      
      // Replace with your treasury address
      const treasuryAddress = 'osmo1t97t0382a0kl2yltwmm6px69ev6vvecvda2jatm5zt8r0p904fgqxhkymu';
      
      const fee = {
        amount: [{ denom: 'uosmo', amount: '5000' }],
        gas: '200000',
      };

      const msg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: address,
          toAddress: treasuryAddress,
          amount: [{ denom: 'uosmo', amount: '1000000' }] // 1 OSMO
        }
      };

      const tx = await client.signAndBroadcast(address, [msg], fee, "Tip for video content");
      
      if (tx.code === 0) {
        alert(`Successfully tipped! Transaction hash: ${tx.transactionHash}`);
      } else {
        throw new Error(`Transaction failed with code ${tx.code}: ${tx.rawLog}`);
      }
    } catch (error) {
      console.error('Tipping failed:', error);
      alert('Failed to send tip. Please try again.');
    }
  };

  const handleMintNFT = async () => {
    if (!address || !client) {
      alert('Please connect your wallet');
      return;
    }

    if (!window.keplr) {
      alert('Please install Keplr wallet');
      return;
    }

    setIsMinting(true);
    try {
      // Replace with your collection address
      const collectionAddress = 'stars14dr75lvlng4qk9t7lxcx9ux4qcqg9xz7zcqt6h';
      
      const fee = {
        amount: [{ denom: 'ustars', amount: '5000' }],
        gas: '200000',
      };

      const msg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
          sender: address,
          contract: collectionAddress,
          msg: {
            mint: {
              token_id: tokenId,
              owner: address,
              token_uri: ipfsLink,
            },
          },
          funds: [{ denom: 'ustars', amount: '1000000' }], // 1 STARS
        }
      };

      const tx = await client.signAndBroadcast(address, [msg], fee, "Mint NFT");

      if (tx.code === 0) {
        alert('NFT minted successfully!');
      } else {
        throw new Error(`Transaction failed with code ${tx.code}: ${tx.rawLog}`);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className={styles.videoComponent}>
      <div className={styles.playerWrapper}>
        <video
          ref={videoRef}
          src={videoUrl}
          onPlay={handlePlay}
          onPause={handlePauseOrEnd}
          onEnded={handlePauseOrEnd}
          controls
          className={styles.videoPlayer}
        />
        <div className={styles.statsOverlay}>
          <span>👁️ {views}</span>
          <button onClick={() => {
            likeVideo(tokenId, userId);
            setLikes((prev) => prev + 1);
          }}>
            👍 {likes}
          </button>
          <button onClick={handleDislike}>
            👎 {dislikes}
          </button>
        </div>
      </div>

      <div className={styles.metadata}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.metadataGrid}>
          {creator && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Creator</span>
              <span className={styles.value}>{creator}</span>
            </div>
          )}
          {category && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Category</span>
              <span className={styles.value}>{category}</span>
            </div>
          )}
          {music && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Music</span>
              <span className={styles.value}>{music}</span>
            </div>
          )}
          {topic && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Topic</span>
              <span className={styles.value}>{topic}</span>
            </div>
          )}
          {mintNumber && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Mint #</span>
              <span className={styles.value}>{mintNumber}</span>
            </div>
          )}
          {price && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Price</span>
              <span className={styles.value}>{price} OM</span>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button className={`${styles.button} ${styles.viewButton}`} onClick={handleViewVideo}>
            View Video
          </button>
          <button className={`${styles.button} ${styles.tipButton}`} onClick={handleTipSnails}>
            Tip SNAILS
          </button>
          <button 
            className={`${styles.button} ${styles.mintButton}`} 
            onClick={handleMintNFT}
            disabled={isMinting}
          >
            {isMinting ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </div>

      {showFeedback && (
        <FeedbackPopup
          tokenId={tokenId}
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default VideoComponent; 