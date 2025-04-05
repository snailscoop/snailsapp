import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import styles from './ChatRoomList.module.css';

const ChatRoomList: React.FC = () => {
  const { rooms, currentRoom, joinRoom, leaveRoom } = useChat();
  const [filter, setFilter] = useState('');

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(filter.toLowerCase()) ||
    room.description?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert(error instanceof Error ? error.message : 'Failed to join room');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Search rooms..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.roomList}>
        {filteredRooms.map(room => (
          <div 
            key={room.id} 
            className={`${styles.roomItem} ${currentRoom === room.id ? styles.active : ''}`}
          >
            <div className={styles.roomInfo}>
              <h3 className={styles.roomName}>{room.name}</h3>
              {room.description && (
                <p className={styles.roomDescription}>{room.description}</p>
              )}
              <div className={styles.roomMeta}>
                <span>{room.currentUsers}/{room.maxUsers} users</span>
              </div>
            </div>
            <button
              onClick={() => currentRoom === room.id ? leaveRoom() : handleJoinRoom(room.id)}
              className={`${styles.joinButton} ${currentRoom === room.id ? styles.leave : ''}`}
            >
              {currentRoom === room.id ? 'Leave' : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRoomList; 