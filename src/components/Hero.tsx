import React, { useEffect, useState } from 'react';
import styles from './Hero.module.css';
import HeroContent from './HeroContent';

const Hero: React.FC = () => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const fadeStart = windowHeight * 0.3;
      const fadeEnd = windowHeight * 0.7;
      
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
    <section className={styles.hero}>
      <video
        className={styles.backgroundVideo}
        src="/videos/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className={styles.heroContent} style={{ opacity }}>
        <HeroContent />
      </div>
    </section>
  );
};

export default Hero; 