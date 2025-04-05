import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import styles from './UserProfileNav.module.css';

interface UserProfileNavProps {
  displayName?: string;
  isPremium?: boolean;
}

export const UserProfileNav: React.FC<UserProfileNavProps> = ({ 
  displayName,
  isPremium 
}) => {
  const { address } = useWallet();
  
  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Truncate address for display
  const truncatedAddress = address 
    ? `${address.slice(0, 8)}...${address.slice(-4)}` 
    : '';

  return (
    <div className={styles.profileNav}>
      <div className={styles.profileInfo}>
        <div className={styles.avatar}>
          {/* Default avatar or first letter of display name */}
          {displayName ? displayName[0].toUpperCase() : '?'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.displayName}>
            {displayName || truncatedAddress}
          </span>
          {displayName && (
            <span className={styles.address}>{truncatedAddress}</span>
          )}
          {isPremium && <span className={styles.premiumIndicator}>⭐</span>}
        </div>
      </div>
      <button 
        className={styles.copyButton}
        onClick={handleCopy}
        title="Copy wallet address"
      >
        📋
      </button>
    </div>
  );
}; 