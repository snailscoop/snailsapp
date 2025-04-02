import React from 'react';
import Hero from '../components/Hero';
import EducationalContent from '../components/EducationalContent';
import styles from './Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <Hero />
      <EducationalContent />
    </div>
  );
};

export default Home; 