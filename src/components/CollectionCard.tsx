import React from 'react';
import { OEMCollection } from '../services/collections';
import styles from './CollectionCard.module.css';

interface CollectionCardProps {
  collection: OEMCollection;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnailContainer}>
        <img 
          src={collection.thumbnailUrl} 
          alt={collection.name} 
          className={styles.thumbnail}
        />
        <div className={styles.duration}>{collection.duration}</div>
        <div className={styles.playOverlay}>
          <img 
            src={collection.platform === 'youtube' ? '/images/youtube-play.svg' : '/images/rumble-play.svg'} 
            alt="Play"
            className={styles.playIcon}
          />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{collection.name}</h3>
        <div className={styles.creator}>
          <a href={collection.creator.link} className={styles.creatorLink}>
            {collection.creator.name}
          </a>
        </div>
        <p className={styles.description}>{collection.description}</p>
        
        <div className={styles.topics}>
          {collection.topics.map((topic, index) => (
            <span key={index} className={styles.topic}>{topic}</span>
          ))}
        </div>

        <div className={styles.mintInfo}>
          <div className={styles.price}>
            {collection.mintInfo.price.amount} {collection.mintInfo.price.denom}
          </div>
          <div className={styles.supply}>
            {collection.mintInfo.mintedCount} / {collection.mintInfo.totalSupply} minted
          </div>
        </div>

        <button 
          className={styles.mintButton}
          disabled={collection.mintInfo.mintStatus !== 'active'}
        >
          {collection.mintInfo.mintStatus === 'upcoming' ? 'Coming Soon' :
           collection.mintInfo.mintStatus === 'ended' ? 'Sold Out' :
           'Mint Now'}
        </button>
      </div>
    </div>
  );
}; 