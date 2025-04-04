import React from 'react';
import { Link } from 'react-router-dom';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
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

const Header: React.FC<HeaderProps> = ({ apiStatus }) => {
  const { connectionStatus: gunStatus } = useGun();
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
              formatAddress(address)
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