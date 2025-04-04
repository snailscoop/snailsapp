import React, { useState } from 'react';
import ContentPage from '../components/ContentPage';
import styles from './Governance.module.css';

const Governance: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');

  return (
    <div className={styles.container}>
      <ContentPage
        title="Governance"
        subtitle="Learn about the power of decentralized decision-making in Cosmos"
        defaultCategory="Governance"
        onApiStatusChange={setApiStatus}
      />
      {/* Additional content specific to Governance will be added here */}
    </div>
  );
};

export default Governance; 