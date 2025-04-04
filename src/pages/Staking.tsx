import React, { useState } from 'react';
import ContentPage from '../components/ContentPage';
import styles from './Staking.module.css';

const Staking: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');

  return (
    <div className={styles.container}>
      <ContentPage
        title="Staking"
        subtitle="Discover how to secure the network and earn rewards through staking"
        defaultCategory="Staking"
        onApiStatusChange={setApiStatus}
      />
      {/* Additional content specific to Staking will be added here */}
    </div>
  );
};

export default Staking; 