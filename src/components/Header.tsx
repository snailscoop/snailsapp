import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { address, isConnecting, error, connect, disconnect } = useWallet();

  const handleWalletClick = async () => {
    if (address) {
      disconnect();
    } else {
      await connect();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link to="/" className={styles.logo}>
          <img src="/images/Logo.png" alt="SNAILS." />
        </Link>
        
        <nav className={styles.nav}>
          <div className={styles.dropdown}>
            <span>EDUCATIONAL CONTENT ▾</span>
            <div className={styles.dropdownContent}>
              <Link to="/getting-started">Getting Started</Link>
              <Link to="/exploring">Exploring the Cosmos</Link>
              <Link to="/community">Community Building</Link>
              <Link to="/blogs">Blogs</Link>
            </div>
          </div>
          
          <div className={styles.dropdown}>
            <span>CO-OP ▾</span>
            <div className={styles.dropdownContent}>
              <Link to="/coop">SNAILS. Co-op</Link>
              <Link to="/publishing">Publishing Group</Link>
            </div>
          </div>
          
          <div className={styles.dropdown}>
            <span>TRADE ▾</span>
            <div className={styles.dropdownContent}>
              <a href="https://www.stargaze.zone/m/snailscoop/tokens" target="_blank" rel="noopener noreferrer">Secondary Market</a>
              <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer">Theme Song</a>
              <a href="https://www.stargaze.zone/l/snailssong" target="_blank" rel="noopener noreferrer">Christmas OEM</a>
            </div>
          </div>
        </nav>
        
        <button 
          className={styles.connectButton}
          onClick={handleWalletClick}
          disabled={isConnecting}
        >
          {isConnecting ? (
            'Connecting...'
          ) : address ? (
            formatAddress(address)
          ) : (
            'Connect Wallet'
          )}
        </button>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 