import React from 'react';
import { useCollections } from '../contexts/CollectionsContext';
import { CollectionCard } from '../components/CollectionCard';
import styles from './GetStarted.module.css';

const GetStarted: React.FC = () => {
  const { collections, isLoading } = useCollections();

  return (
    <div className={styles.page}>
      <video
        className={styles.backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
        src="/videos/background.mp4"
      />
      
      <div className={styles.header}>
        <h1>Getting Started Content</h1>
        <p>Educational videos to help you navigate the Cosmos ecosystem</p>
        <p className={styles.supportText}>
          Support SNAILS by collecting educational content
        </p>
      </div>

      <div className={styles.videoGrid}>
        {isLoading ? (
          <div className={styles.loading}>Loading videos...</div>
        ) : collections.length > 0 ? (
          collections.map(collection => (
            <CollectionCard 
              key={collection.contractAddress} 
              collection={collection} 
            />
          ))
        ) : (
          <div className={styles.noVideos}>No videos available</div>
        )}
      </div>
    </div>
  );
};

export default GetStarted; 