import React, { useState, useEffect, useRef } from 'react';
import { viewVideo, logWatchTime, likeVideo, getViews, getLikes } from '../services/algorithm';
import CustomVideoPlayer from './CustomVideoPlayer';
import styles from './EnhancedVideoPlayer.module.css';

interface EnhancedVideoPlayerProps {
  tokenId: string;
  src: string;
  poster?: string;
  userId?: string;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({ 
  tokenId, 
  src, 
  poster,
  userId = 'anonymous' // Default user ID if not provided
}) => {
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setViews(await getViews(tokenId));
      setLikes(await getLikes(tokenId));
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

  const handleLike = () => {
    likeVideo(tokenId, userId);
    setLikes(prev => prev + 1);
  };

  return (
    <div className={styles.container}>
      <CustomVideoPlayer
        src={src}
        poster={poster}
        isPreview={false}
        onPlay={handlePlay}
        onPause={handlePauseOrEnd}
        onEnded={handlePauseOrEnd}
      />
      <div className={styles.controls}>
        <span className={styles.stat}>👁️ {views}</span>
        <button onClick={handleLike} className={styles.likeButton}>
          👍 {likes}
        </button>
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer; 