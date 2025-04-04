import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGun } from '../contexts/GunContext';
import { useNFTVerification } from '../hooks/useNFTVerification';
import { signUsernamePermit } from '../utils/wallet';
import styles from './UserProfile.module.css';

interface UserProfileData {
  name: string;
  bio: string;
  avatar: string;
  twitter: string;
  discord: string;
  telegram: string;
  isVerifiedHolder: boolean;
  displayNamePreference: 'wallet' | 'custom';
  lastActive: number;
  signature?: string;
  pubKey?: string;
  nftMetadata?: {
    tokenId: string;
    image: string;
    name: string;
    description?: string;
  } | null;
}

const defaultProfileData: UserProfileData = {
  name: '',
  bio: '',
  avatar: '',
  twitter: '',
  discord: '',
  telegram: '',
  isVerifiedHolder: false,
  displayNamePreference: 'wallet',
  lastActive: Date.now()
};

const UserProfile: React.FC = () => {
  const { address } = useWallet();
  const { gun, authenticateUser } = useGun();
  const { loading: verificationLoading, nftMetadata } = useNFTVerification();
  const [profileData, setProfileData] = useState<UserProfileData>(defaultProfileData);
  const [editData, setEditData] = useState<UserProfileData>(defaultProfileData);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!gun || !address) return;

    // Load profile data once
    gun.get('users')
       .get(address)
       .once((data: any) => {
         if (data) {
           // Validate and set defaults for profile data
           const validatedData: UserProfileData = {
             name: data.name || address?.slice(0, 8) + '...' + address?.slice(-4),
             bio: data.bio || '',
             avatar: data.avatar || '',
             twitter: data.twitter || '',
             discord: data.discord || '',
             telegram: data.telegram || '',
             isVerifiedHolder: data.isVerifiedHolder || false,
             displayNamePreference: data.displayNamePreference || 'wallet',
             lastActive: data.lastActive || Date.now(),
             signature: data.signature || undefined,
             pubKey: data.pubKey || undefined,
             nftMetadata: data.nftMetadata || undefined
           };
           setProfileData(validatedData);
           setEditData(validatedData);
         } else {
           // Set default data with wallet address as name
           const defaultData: UserProfileData = {
             ...defaultProfileData,
             name: address?.slice(0, 8) + '...' + address?.slice(-4)
           };
           setProfileData(defaultData);
           setEditData(defaultData);
         }
       });
  }, [gun, address]);

  const handleSave = async () => {
    if (!gun || !address) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Get permit for username change
      const permit = await signUsernamePermit(editData.name, address);
      
      // Authenticate user with Gun
      await authenticateUser(address, permit.signature);
      
      // Create a clean profile object
      const profileData = {
        name: editData.name,
        bio: editData.bio || '',
        avatar: editData.avatar || '',
        twitter: editData.twitter || '',
        discord: editData.discord || '',
        telegram: editData.telegram || '',
        isVerifiedHolder: editData.isVerifiedHolder,
        displayNamePreference: editData.displayNamePreference,
        lastActive: Date.now(),
        signature: permit.signature,
        pubKey: permit.pub_key,
        nftMetadata: editData.nftMetadata
      };

      // Save to GunDB
      await new Promise<void>((resolve, reject) => {
        gun.get('users')
           .get(address)
           .put(profileData, (ack: any) => {
             if (ack.err) {
               reject(new Error(ack.err));
             } else {
               resolve();
             }
           });
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  return (
    <div className={styles.profileContainer}>
      {isEditing ? (
        <div className={styles.editForm}>
          <h2>Edit Profile</h2>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Enter your name"
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
              placeholder="Enter avatar URL"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Twitter</label>
            <input
              type="text"
              value={editData.twitter}
              onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Discord</label>
            <input
              type="text"
              value={editData.discord}
              onChange={(e) => setEditData({ ...editData, discord: e.target.value })}
              placeholder="username#0000"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Telegram</label>
            <input
              type="text"
              value={editData.telegram}
              onChange={(e) => setEditData({ ...editData, telegram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className={styles.buttonGroup}>
            <button onClick={handleCancel} disabled={isSaving}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {saveError && <div className={styles.error}>{saveError}</div>}
        </div>
      ) : (
        <div className={styles.profileView}>
          <h2>Profile</h2>
          <div className={styles.profileHeader}>
            {profileData.avatar && (
              <img src={profileData.avatar} alt="Profile" className={styles.avatar} />
            )}
            <div className={styles.profileInfo}>
              <h3>
                {profileData.name}
                {profileData.isVerifiedHolder && (
                  <span 
                    className={styles.verifiedBadge} 
                    title="Verified SNAILS NFT Holder"
                  >
                    🐌
                  </span>
                )}
              </h3>
              {verificationLoading && (
                <div className={styles.verificationStatus}>
                  Verifying NFT ownership...
                </div>
              )}
            </div>
          </div>
          {profileData.bio && <p className={styles.bio}>{profileData.bio}</p>}
          <div className={styles.socialLinks}>
            {profileData.twitter && (
              <a href={`https://twitter.com/${profileData.twitter}`} target="_blank" rel="noopener noreferrer">
                Twitter: @{profileData.twitter}
              </a>
            )}
            {profileData.discord && <p>Discord: {profileData.discord}</p>}
            {profileData.telegram && (
              <a href={`https://t.me/${profileData.telegram}`} target="_blank" rel="noopener noreferrer">
                Telegram: @{profileData.telegram}
              </a>
            )}
          </div>
          {profileData.isVerifiedHolder && profileData.nftMetadata && (
            <div className={styles.nftSection}>
              <h3>Your SNAILS NFT</h3>
              <div className={styles.nftCard}>
                <img 
                  src={profileData.nftMetadata.image} 
                  alt={profileData.nftMetadata.name}
                  className={styles.nftImage}
                />
                <div className={styles.nftInfo}>
                  <h4>{profileData.nftMetadata.name}</h4>
                  {profileData.nftMetadata.description && (
                    <p>{profileData.nftMetadata.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 