import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import { useNFTVerification } from '../hooks/useNFTVerification';
import NavDropdown from './NavDropdown';
import styles from './Header.module.css';

interface TrafficLightProps {
  status: 'green' | 'blue' | 'yellow' | 'red';
  label: string;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ status, label }) => (
  <div className={styles.trafficLightContainer}>
    <span className={styles.trafficLabel}>{label}</span>
    <div className={styles.trafficLight}>
      <span className={`${styles.light} ${styles.red} ${status === 'red' ? styles.active : ''}`} />
      <span className={`${styles.light} ${styles.yellow} ${status === 'yellow' ? styles.active : ''}`} />
      <span className={`${styles.light} ${styles.green} ${status === 'green' ? styles.active : ''}`} />
      <span className={`${styles.light} ${styles.blue} ${status === 'blue' ? styles.active : ''}`} />
    </div>
  </div>
);

interface HeaderProps {
  apiStatus: 'green' | 'blue' | 'yellow' | 'red';
}

interface UserData {
  name?: string;
  displayNamePreference?: 'wallet' | 'custom';
}

const displayUsername = (address: string, isVerified: boolean, userData?: UserData) => {
  let displayName = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  if (userData?.displayNamePreference === 'custom' && userData?.name) {
    displayName = userData.name;
  }
  
  return (
    <span className={styles.usernameDisplay}>
      {displayName}
      {isVerified && (
        <span 
          className={styles.verifiedBadge} 
          title="Verified SNAILS holder"
          role="img" 
          aria-label="Snail emoji indicating verified SNAILS holder"
        >
          🐌
        </span>
      )}
    </span>
  );
};

const Header: React.FC<HeaderProps> = ({ apiStatus }) => {
  const { gun, connectionStatus: gunStatus } = useGun();
  const { address, isConnecting, error, connect, disconnect } = useWallet();
  const { isVerified } = useNFTVerification();
  const [userData, setUserData] = useState<UserData>();

  useEffect(() => {
    if (!gun || !address) {
      setUserData(undefined);
      return;
    }

    const userRef = gun.get('users').get(address);
    userRef.on((data: UserData) => {
      if (data) {
        setUserData(data);
      }
    });

    return () => {
      userRef.off();
    };
  }, [gun, address]);

  const handleWalletClick = async () => {
    if (address) {
      disconnect();
    } else {
      await connect();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logo}>
            <img src="/images/Logo.png" alt="SNAILS." />
          </Link>
          
          <nav className={styles.nav}>
            <div className={styles.dropdown}>
              <span>EDUCATIONAL CONTENT ▾</span>
              <div className={styles.dropdownContent}>
                <Link to="/getting-started">Getting Started</Link>
                <Link to="/exploring-cosmos">Exploring the Cosmos</Link>
                <Link to="/community-building">Community Building</Link>
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
        </div>

        <div className={styles.rightSection}>
          <div className={styles.statusLights}>
            <TrafficLight status={apiStatus} label="API" />
            <TrafficLight status={gunStatus} label="P2P" />
          </div>
          <button 
            className={styles.connectButton}
            onClick={handleWalletClick}
            disabled={isConnecting}
          >
            {isConnecting ? (
              'Connecting...'
            ) : address ? (
              displayUsername(address, isVerified, userData)
            ) : (
              'Connect Wallet'
            )}
          </button>
          <NavDropdown />
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 