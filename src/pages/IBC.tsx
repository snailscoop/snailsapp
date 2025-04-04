import React, { useState } from 'react';
import ContentPage from '../components/ContentPage';
import styles from './IBC.module.css';

const IBC: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');

  return (
    <div className={styles.container}>
      <ContentPage
        title="IBC"
        subtitle="Explore the Inter-Blockchain Communication protocol that connects the Cosmos"
        defaultCategory="IBC"
        onApiStatusChange={setApiStatus}
      />
      {/* Additional content specific to IBC will be added here */}
    </div>
  );
};

export default IBC; 