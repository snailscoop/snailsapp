import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { PERMIT_TYPES } from '../utils/wallet';
import { permitCache } from '../utils/permitCache';
import styles from './PermitTimer.module.css';

const PermitTimer: React.FC = () => {
  const { address } = useWallet();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number | null>>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!address) return;

    const updateTimes = () => {
      const times: Record<string, number | null> = {};
      let hasActivePermit = false;

      Object.keys(PERMIT_TYPES).forEach(type => {
        const remaining = permitCache.getTimeRemaining(address, type as keyof typeof PERMIT_TYPES);
        if (remaining !== null) {
          times[type] = remaining;
          hasActivePermit = true;
        }
      });

      setTimeRemaining(times);
      setVisible(hasActivePermit);
    };

    // Update immediately and then every second
    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [address]);

  if (!visible) return null;

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Permit Expiration</div>
      {Object.entries(timeRemaining).map(([type, time]) => (
        time !== null && (
          <div key={type} className={styles.timer}>
            <span className={styles.type}>{type}:</span>
            <span className={styles.time}>{formatTime(time)}</span>
          </div>
        )
      ))}
    </div>
  );
};

export default PermitTimer; 