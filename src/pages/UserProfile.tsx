import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { PremiumStatus } from '../components/PremiumStatus';
import TrafficLights from '../components/TrafficLights';
import { useGun } from '../contexts/GunContext';
import { UserProfileNav } from '../components/UserProfileNav';
import styles from './UserProfile.module.css';

export const UserProfile: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { connectionState: p2pConnected } = useGun();
  const [isPremium, setIsPremium] = useState(false);
  const [dmsEnabled, setDmsEnabled] = useState(true);
  const [statusError, setStatusError] = useState<string | null>("Failed to check status. Please try again.");

  // Mock data - replace with actual data from your backend
  const premiumExpiration = new Date('2024-12-31').toLocaleDateString();
  const memberSince = new Date('2023-01-01').toLocaleDateString();
  const displayName = "SNAILS User"; // Replace with actual display name from your backend

  if (!isConnected) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.error}>
            Please connect your wallet to view your profile
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>User Profile</h1>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <UserProfileNav 
              displayName={displayName}
              isPremium={isPremium}
            />
          </div>

          {statusError && (
            <div className={styles.section}>
              <div className={styles.error}>
                {statusError}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <h2>Profile Settings</h2>
                {isPremium && <span className={styles.premiumBadge}>⭐</span>}
              </div>
              
              <div className={styles.profileInfo}>
                <div className={styles.infoRow}>
                  <span>Member Since</span>
                  <span>{memberSince}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span>Membership Status</span>
                  <span className={isPremium ? styles.premium : styles.standard}>
                    {isPremium ? 'Premium Member' : 'Standard Member'}
                  </span>
                </div>
                
                {isPremium && (
                  <div className={styles.infoRow}>
                    <span>Premium Expires</span>
                    <span>{premiumExpiration}</span>
                  </div>
                )}
              </div>

              <div className={styles.settingsSection}>
                <h3>Communication Settings</h3>
                <div className={styles.settingItem}>
                  <span>Direct Messages</span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={dmsEnabled}
                      onChange={(e) => setDmsEnabled(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <PremiumStatus onStatusChange={setIsPremium} />
          </div>
        </div>

        <div className={styles.footer}>
          <TrafficLights
            labels={['API', 'P2P']}
            statuses={[
              isConnected,
              p2pConnected
            ]}
          />
        </div>
      </div>
    </div>
  );
}; 