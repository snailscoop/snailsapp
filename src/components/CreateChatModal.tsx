import React, { useState } from 'react';
import styles from '../styles/Modal.module.css';

export type ChatType = 'room' | 'dm' | 'broadcast' | 'group';

export interface ChatCreationData {
  name: string;
  description: string;
  isDiscoverable?: boolean;
  isPrivate?: boolean;
}

interface CreateChatModalProps {
  type: ChatType;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: ChatCreationData) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({
  type,
  isOpen,
  onClose,
  onCreate
}) => {
  const [formData, setFormData] = useState<ChatCreationData>({
    name: '',
    description: '',
    isDiscoverable: true,
    isPrivate: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({
      name: '',
      description: '',
      isDiscoverable: true,
      isPrivate: false
    });
    onClose();
  };

  const typeLabels = {
    room: 'Chat Room',
    dm: 'Direct Message',
    broadcast: 'Broadcast Channel',
    group: 'Group Chat'
  };

  const typeDescriptions = {
    room: 'Create a new chat room for group conversations',
    dm: 'Start a private conversation with another user',
    broadcast: 'Create a channel to broadcast messages to subscribers',
    group: 'Create a group chat room for up to 100 members'
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Create New {typeLabels[type]}</h2>
        <p className={styles.description}>{typeDescriptions[type]}</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Enter ${typeLabels[type].toLowerCase()} name`}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter a brief description"
              required
            />
          </div>

          {(type === 'group' || type === 'broadcast') && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isDiscoverable}
                  onChange={(e) => setFormData({ ...formData, isDiscoverable: e.target.checked })}
                />
                Make {type === 'group' ? 'chat' : 'channel'} discoverable in explore section
              </label>
            </div>
          )}

          {type === 'group' && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                />
                Make chat private (invite only)
              </label>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Create {typeLabels[type]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatModal; 