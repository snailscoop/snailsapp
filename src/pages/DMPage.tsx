import React from 'react';
import ChatRoomList from '../components/ChatRoomList';
import ChatMessages from '../components/ChatMessages';
import styles from './DMPage.module.css';

const DMPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ChatRoomList />
      </div>
      <div className={styles.main}>
        <ChatMessages />
      </div>
    </div>
  );
};

export default DMPage; 