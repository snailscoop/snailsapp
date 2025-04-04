import React from 'react';
import Hero from '../components/Hero';
import ContentCategories from '../components/ContentCategories';
import styles from './Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      <Hero />
      <main className={styles.main}>
        <ContentCategories />
      </main>
    </div>
  );
};

export default Home; 