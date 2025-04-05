import React, { useEffect, useState, useRef } from 'react';
import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  subtitle?: string;
  mascotImage?: string;
  backgroundVideo?: string;
}

const Hero: React.FC<HeroProps> = ({ 
  title, 
  subtitle, 
  mascotImage,
  backgroundVideo = '/videos/background.mp4'
}) => {
  const [opacity, setOpacity] = useState(1);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      const scrollPosition = window.scrollY;
      const heroHeight = heroRef.current.offsetHeight;
      const fadeStart = heroHeight * 0.3;
      const fadeEnd = heroHeight * 0.8;
      
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
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={heroRef} className={styles.hero}>
      <video
        className={styles.backgroundVideo}
        src={backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className={styles.heroContent} style={{ opacity }}>
        <div className={styles.titleGroup}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {mascotImage && (
          <div className={styles.mascotWrapper}>
            <img src={mascotImage} alt="Mascot" className={styles.mascot} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero; 