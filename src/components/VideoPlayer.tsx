import React, { useRef, useEffect, useState } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  title: string;
  description: string;
  creator: string;
  price: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, description, creator, price }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>('0:00');

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(video.duration / 60);
        const seconds = Math.floor(video.duration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      });
    }
  }, []);

  return (
    <div className={styles.videoCard}>
      <div className={styles.videoPreview}>
        <video
          ref={videoRef}
          src={src}
          controls
          preload="metadata"
        >
          Your browser does not support the video element.
        </video>
        <div className={styles.videoDuration}>{duration}</div>
      </div>
      <div className={styles.videoContent}>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className={styles.videoMeta}>
          <span className={styles.creator}>{creator}</span>
          <span className={styles.price}>{price}</span>
        </div>
        <button className={styles.mintButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 8H9L12 2Z" fill="currentColor"/>
            <path d="M12 22L9 16H15L12 22Z" fill="currentColor"/>
          </svg>
          Mint Video
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer; 