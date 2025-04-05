import React from 'react';
import { Link } from 'react-router-dom';
import NavDropdown from './NavDropdown';
import styles from './Header.module.css';

interface HeaderProps {
  apiStatus: {
    status: 'green' | 'yellow' | 'red';
  };
}

const Header: React.FC<HeaderProps> = ({ apiStatus }) => {
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

            <div className={styles.dropdown}>
              <span>CHATS ▾</span>
              <div className={styles.dropdownContent}>
                <Link to="/chats/groups">Groups</Link>
                <Link to="/chats/dms">DM's</Link>
                <Link to="/chats/broadcasts">Broadcasts</Link>
              </div>
            </div>

            <div className={styles.dropdown}>
              <span>TOKEN GATING ▾</span>
              <div className={styles.dropdownContent}>
                <Link to="/token-gating">Configure</Link>
              </div>
            </div>
          </nav>
        </div>

        <div className={styles.rightSection}>
          <NavDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header; 