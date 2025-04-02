import React from 'react';
import styles from './VideoBackground.module.css';

const VideoBackground: React.FC = () => {
  return (
    <div className={styles.videoBackground}>
      <video
        autoPlay
        loop
        muted
        playsInline
        src="/videos/background.mp4"
      >
        Your browser does not support the video tag.
      </video>
      <div className={styles.overlay}></div>
    </div>
  );
};

export default VideoBackground; 