import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGun } from '../contexts/GunContext';
import { useNFTVerification } from '../hooks/useNFTVerification';
import styles from './UserProfile.module.css';

interface UserProfileData {
  name: string;
  bio: string;
  avatar: string;
  twitter: string;
  discord: string;
  telegram: string;
  snailsNFTs: string[];
  isVerifiedHolder: boolean;
}

interface GunUserData {
  name?: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  snailsNFTs?: string[];
  isVerifiedHolder?: boolean;
}

const UserProfile: React.FC = () => {
  const { address } = useWallet();
  const { gun, user, connectionStatus } = useGun();
  const { isVerified, loading: verificationLoading } = useNFTVerification();
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    bio: '',
    avatar: '',
    twitter: '',
    discord: '',
    telegram: '',
    snailsNFTs: [],
    isVerifiedHolder: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileData>({
    name: '',
    bio: '',
    avatar: '',
    twitter: '',
    discord: '',
    telegram: '',
    snailsNFTs: [],
    isVerifiedHolder: false
  });

  useEffect(() => {
    if (!gun || !address) return;

    // Subscribe to profile data changes
    const userRef = gun.get('users').get(address);
    userRef.on((data: GunUserData) => {
      if (data) {
        const updatedData: UserProfileData = {
          name: data.name || address?.slice(0, 8) + '...' + address?.slice(-4),
          bio: data.bio || '',
          avatar: data.avatar || '',
          twitter: data.twitter || '',
          discord: data.discord || '',
          telegram: data.telegram || '',
          snailsNFTs: data.snailsNFTs || [],
          isVerifiedHolder: isVerified
        };
        setProfileData(updatedData);
        setEditData(updatedData);
      } else {
        // Set default data with wallet address as name
        const defaultData: UserProfileData = {
          name: address?.slice(0, 8) + '...' + address?.slice(-4),
          bio: '',
          avatar: '',
          twitter: '',
          discord: '',
          telegram: '',
          snailsNFTs: [],
          isVerifiedHolder: isVerified
        };
        setProfileData(defaultData);
        setEditData(defaultData);
      }
    });

    return () => {
      userRef.off();
    };
  }, [gun, address, isVerified]);

  const handleSave = () => {
    if (!gun || !address) return;

    const userRef = gun.get('users').get(address);
    userRef.put({
      name: editData.name,
      bio: editData.bio,
      avatar: editData.avatar,
      twitter: editData.twitter,
      discord: editData.discord,
      telegram: editData.telegram,
      snailsNFTs: editData.snailsNFTs,
      isVerifiedHolder: editData.isVerifiedHolder
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="page-container">
      <div className={styles.navigationBar}>
        <h1>User Profile</h1>
        {isEditing ? (
          <div className={styles.buttonGroup}>
            <button onClick={handleCancel} className={styles.cancelButton}>Cancel</button>
            <button onClick={handleSave} className={styles.saveButton}>Save Changes</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className={styles.editButton}>
            Edit Profile
          </button>
        )}
      </div>

      {!address ? (
        <div className={styles.connectPrompt}>Please connect your wallet to view your profile.</div>
      ) : isEditing ? (
        <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className={styles.formGroup}>
            <label>Name (defaults to wallet address)</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder={address?.slice(0, 8) + '...' + address?.slice(-4)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Tell us about yourself"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Avatar URL</label>
            <input
              type="text"
              value={editData.avatar}
              onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
              placeholder="Link to your profile picture"
            />
          </div>

          <div className={styles.formGroup}>
            <label>X (Twitter) Handle</label>
            <input
              type="text"
              value={editData.twitter}
              onChange={(e) => setEditData({ ...editData, twitter: e.target.value.replace('@', '') })}
              placeholder="@username"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Discord Username</label>
            <input
              type="text"
              value={editData.discord}
              onChange={(e) => setEditData({ ...editData, discord: e.target.value })}
              placeholder="username#0000"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telegram Username</label>
            <input
              type="text"
              value={editData.telegram}
              onChange={(e) => setEditData({ ...editData, telegram: e.target.value.replace('@', '') })}
              placeholder="@username"
            />
          </div>
        </form>
      ) : (
        <div className={styles.profileContent}>
          <div className={styles.profileHeader}>
            {profileData.avatar && (
              <img src={profileData.avatar} alt="Profile" className={styles.avatar} />
            )}
            <div className={styles.profileMeta}>
              <h2>
                {profileData.name}
                {isVerified && <span className={styles.verifiedBadge} title="Verified SNAILS holder">🐌</span>}
              </h2>
              <p className={styles.walletAddress}>{address}</p>
              <p>{profileData.bio}</p>
            </div>
          </div>

          <div className={styles.socialLinks}>
            {profileData.twitter && (
              <a 
                href={`https://twitter.com/${profileData.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.socialLink}
              >
                <img src="/images/x-logo.svg" alt="X (Twitter)" />
                @{profileData.twitter}
              </a>
            )}
            {profileData.discord && (
              <div className={styles.socialLink}>
                <img src="/images/discord-logo.svg" alt="Discord" />
                {profileData.discord}
              </div>
            )}
            {profileData.telegram && (
              <a 
                href={`https://t.me/${profileData.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.socialLink}
              >
                <img src="/images/telegram-logo.svg" alt="Telegram" />
                @{profileData.telegram}
              </a>
            )}
          </div>

          {verificationLoading ? (
            <div className={styles.loading}>Verifying NFT ownership...</div>
          ) : (
            <div className={styles.nftSection}>
              <h3>SNAILS NFTs</h3>
              <div className={styles.nftGrid}>
                {profileData.snailsNFTs.map((nft, index) => (
                  <div key={index} className={styles.nftCard}>
                    {/* NFT display logic here */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile; 