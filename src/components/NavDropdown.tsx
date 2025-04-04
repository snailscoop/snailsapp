import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import styles from './NavDropdown.module.css';

const NavDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { connect, disconnect, address } = useWallet();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <img
        src="/images/SNAILS.charged.png"
        alt="SNAILS Menu"
        className={styles.snailsImage}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button 
            className={styles.dropdownItem} 
            onClick={address ? disconnect : handleConnect}
          >
            {address ? 'Disconnect Keplr' : 'Connect Keplr'}
          </button>
          <button 
            className={styles.dropdownItem} 
            onClick={handleProfileClick}
          >
            User Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default NavDropdown; 