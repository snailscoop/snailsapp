import React from 'react';
import ContentPage from '../components/ContentPage';
import styles from './CommunityBuilding.module.css';

const CommunityBuilding: React.FC = () => {
  return (
    <div className={styles.container}>
      <ContentPage
        title="Community Building"
        subtitle="Learn how to grow and engage with your Web3 community"
        defaultCategory="Community"
      />
    </div>
  );
};

export default CommunityBuilding; 