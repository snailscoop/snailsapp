import React from 'react';

interface FeedbackPopupProps {
  tokenId: string;
  userId: string;
  onClose: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ tokenId, userId, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '10px',
        width: '300px',
        textAlign: 'center',
      }}>
        <h3>Feedback for Video {tokenId}</h3>
        <p>User ID: {userId}</p>
        <button onClick={onClose} style={{
          padding: '10px 20px',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>
  );
};

export default FeedbackPopup; 