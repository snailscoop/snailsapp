import React, { useEffect, useState, useCallback } from 'react';
import styles from './HeroContent.module.css';

const HeroContent: React.FC = () => {
  const [opacity, setOpacity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsDropdownOpen(true);
  }, [closeTimeout]);

  const handleMouseLeave = useCallback(() => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300); // 300ms delay before closing
    setCloseTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const fadeStart = 100; // Start fading after 100px of scroll
      const fadeEnd = 400; // Completely faded by 400px of scroll
      
      if (scrollPosition <= fadeStart) {
        setOpacity(1);
      } else if (scrollPosition >= fadeEnd) {
        setOpacity(0);
      } else {
        const fadeRange = fadeEnd - fadeStart;
        const fadeAmount = (fadeEnd - scrollPosition) / fadeRange;
        setOpacity(Math.max(0, Math.min(1, fadeAmount)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.wrapper} style={{ opacity, transition: 'opacity 0.3s ease-out' }}>
      <div className={styles.content}>
        <div className={styles.titleGroup}>
          <h1>SNAILS.</h1>
          <p>The Creator Co-Op for Cosmos Ecosystem</p>
          <div className={styles.communityWrapper}>
            <div 
              className={styles.dropdownContainer}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className={styles.communityButton}>
                Community Chats
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownLinks}>
                    <a href="https://discord.com/invite/ABMZF6v492" target="_blank" rel="noopener noreferrer" className={styles.dropdownItem}>
                      Discord
                    </a>
                    <a href="https://t.me/snailsnft" target="_blank" rel="noopener noreferrer" className={styles.dropdownItem}>
                      Telegram
                    </a>
                  </div>
                  <div className={styles.dropdownImage}>
                    <img src="/images/SNAILS.StickerPePe.png" alt="Snails Sticker" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.mascotWrapper}>
        <img 
          src="/images/Dail.webp" 
          alt="Dail" 
          className={styles.mascot}
        />
      </div>
    </div>
  );
};

export default HeroContent; 