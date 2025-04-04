import React from 'react';
import ContentPage from '../components/ContentPage';
import styles from './ExploringCosmos.module.css';

const ExploringCosmos: React.FC = () => {
  return (
    <div className={styles.container}>
      <ContentPage
        title="Exploring Cosmos"
        subtitle="Discover the vast ecosystem of interconnected blockchains"
        defaultCategory="Cosmos"
      />
    </div>
  );
};

export default ExploringCosmos;

 