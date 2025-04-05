import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { SnailsPremiumCheck } from './SnailsPremiumCheck';
import styles from './NavDropdown.module.css';

const NavDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { connect, disconnect, address } = useWallet();
  const [isPremium, setIsPremium] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with actual data from your backend
  const displayName = "SNAILS User"; // Replace with actual display name

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    await connect();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

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
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {address ? (
        <div className={styles.profileButton} onClick={() => setIsOpen(!isOpen)}>
          <div className={styles.avatar}>
            {displayName ? displayName[0].toUpperCase() : '?'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.displayName}>
              {displayName || truncatedAddress}
            </span>
            {displayName && (
              <span className={styles.address}>{truncatedAddress}</span>
            )}
          </div>
          {isPremium && <span className={styles.premiumIndicator}>⭐</span>}
          <button 
            className={styles.copyButton}
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="Copy wallet address"
          >
            📋
          </button>
        </div>
      ) : (
        <button 
          className={styles.connectButton}
          onClick={handleConnect}
        >
          Connect Wallet
        </button>
      )}
      
      {isOpen && address && (
        <div className={styles.dropdownMenu}>
          <button 
            className={styles.dropdownItem} 
            onClick={handleProfileClick}
          >
            View Profile
          </button>
          <button 
            className={styles.dropdownItem} 
            onClick={disconnect}
          >
            Disconnect
          </button>
        </div>
      )}
      <div style={{ display: 'none' }}>
        {address && <SnailsPremiumCheck onStatusChange={setIsPremium} />}
      </div>
    </div>
  );
};

export default NavDropdown; 