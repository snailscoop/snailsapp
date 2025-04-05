import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { PremiumStatus } from '../components/PremiumStatus';
import { TokenGatingConfig } from '../components/TokenGatingConfig';
import styles from './TokenGatingDemo.module.css';

export const TokenGatingDemo: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [isPremium, setIsPremium] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [gatingRules, setGatingRules] = useState<any[]>([]);

  if (!isConnected || !address) {
    return (
      <div className={styles.container}>
        <div className={styles.message}>Please connect your wallet to view the demo</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Token Gating Demo</h2>
        <button 
          className={styles.configButton}
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? 'Hide Config' : 'Show Config'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h3>Current Status</h3>
          <PremiumStatus onStatusChange={setIsPremium} />
        </div>

        {showConfig && (
          <div className={styles.section}>
            <h3>Token Gating Configuration</h3>
            <TokenGatingConfig 
              onConfigChange={setGatingRules}
              isOpen={true}
            />
          </div>
        )}

        <div className={styles.section}>
          <h3>Active Rules</h3>
          {gatingRules.length > 0 ? (
            <ul className={styles.rulesList}>
              {gatingRules.map((rule, index) => (
                <li key={index} className={styles.ruleItem}>
                  <div className={styles.ruleType}>{rule.type.toUpperCase()}</div>
                  <div className={styles.ruleDetails}>
                    <div>Contract: {rule.contract.slice(0, 6)}...{rule.contract.slice(-4)}</div>
                    <div>Min Amount: {rule.minAmount}</div>
                    <div>Modes: {rule.mode.join(', ')}</div>
                    {rule.usdValue && <div>USD Value: ${rule.usdValue}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.message}>No active rules configured</div>
          )}
        </div>
      </div>
    </div>
  );
}; 