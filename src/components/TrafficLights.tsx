import React from 'react';
import styles from './TrafficLights.module.css';

interface TrafficLightsProps {
  labels: string[];
  statuses: boolean[];
}

const TrafficLights: React.FC<TrafficLightsProps> = ({ labels, statuses }) => {
  return (
    <div className={styles.trafficLights}>
      {labels.map((label, index) => (
        <div key={label} className={styles.light}>
          <div className={`${styles.indicator} ${statuses[index] ? styles.green : styles.red}`} />
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrafficLights; 