import React, { useState } from 'react';
import { OEMCollection } from '../services/collections';
import styles from './CollectionMint.module.css';

interface CollectionMintProps {
  collection: OEMCollection;
}

export const CollectionMint: React.FC<CollectionMintProps> = ({ collection }) => {
  const [mintAmount, setMintAmount] = useState(1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{collection.name}</h1>
        <div className={styles.creator}>
          Created by <a href={collection.creator.link}>{collection.creator.name}</a>
          {collection.socialLinks.twitter && (
            <a href={collection.socialLinks.twitter} className={styles.twitter}>
              <img src="/images/twitter.svg" alt="Twitter" />
            </a>
          )}
        </div>
        <p className={styles.description}>{collection.description}</p>
      </div>

      <div className={styles.mintProgress}>
        <div className={styles.progressLabel}>
          <span>Total Minted</span>
          <span className={styles.percentage}>
            {collection.mintInfo.mintedPercentage.toFixed(2)}%
            {collection.mintInfo.airdropPercentage > 0 && 
              ` (${collection.mintInfo.airdropPercentage}% airdropped)`
            }
          </span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${collection.mintInfo.mintedPercentage}%` }}
          />
        </div>
        <div className={styles.mintCount}>
          ({collection.mintInfo.mintedCount}/{collection.mintInfo.totalSupply})
        </div>
      </div>

      <div className={styles.mintingInterface}>
        <div className={styles.sgStatus}>
          <h3>SG Active Addresses</h3>
          <div className={styles.statusIndicators}>
            {collection.sgInfo.isLive && (
              <span className={styles.statusLive}>Live</span>
            )}
            {collection.sgInfo.isPublic && (
              <span className={styles.statusPublic}>Public</span>
            )}
          </div>
        </div>

        <div className={styles.priceInfo}>
          <div className={styles.price}>
            <span className={styles.amount}>
              {collection.mintInfo.price.amount} {collection.mintInfo.price.denom}
            </span>
            {collection.mintInfo.price.usd && (
              <span className={styles.usdPrice}>${collection.mintInfo.price.usd}</span>
            )}
          </div>
          {collection.mintInfo.isEligible && (
            <span className={styles.eligible}>Eligible</span>
          )}
        </div>

        <div className={styles.mintControls}>
          <div className={styles.mintAmount}>
            <input
              type="number"
              min="1"
              max="50"
              value={mintAmount}
              onChange={(e) => setMintAmount(Math.min(50, Math.max(1, parseInt(e.target.value))))}
            />
            <button 
              className={styles.maxButton}
              onClick={() => setMintAmount(50)}
            >
              MAX
            </button>
          </div>

          <button 
            className={styles.mintButton}
            disabled={!collection.mintInfo.isEligible || collection.mintInfo.mintStatus !== 'active'}
          >
            Deposit {collection.mintInfo.price.denom}
          </button>

          <a 
            href={`https://www.stargaze.zone/m/${collection.contractAddress}/tokens`}
            className={styles.marketplaceLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            See on Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}; 