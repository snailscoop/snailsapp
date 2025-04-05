import React, { useState, useEffect, useRef } from 'react';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import styles from '../styles/ChatLayout.module.css';
import CreateChatModal, { ChatCreationData } from '../components/CreateChatModal';

interface GroupRoom {
  id: string;
  name: string;
  description: string;
  owner: string;
  memberCount: number;
  createdAt: number;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
  isDiscoverable?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  timestamp: number;
}

const GroupChat: React.FC = () => {
  const { gun } = useGun();
  const { address } = useWallet();
  const [rooms, setRooms] = useState<GroupRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [publicRooms, setPublicRooms] = useState<GroupRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!gun || !address) return;
    
    // Subscribe to user's rooms
    const roomsRef = gun.get('users').get(address).get('rooms');
    roomsRef.map().on((room: any, id: string) => {
      if (!room) return;
      gun.get('rooms').get(id).once((roomData: any) => {
        if (!roomData) return;
        setRooms(prev => {
          const exists = prev.find(r => r.id === id);
          if (exists) {
            return prev.map(r => r.id === id ? { ...r, ...roomData, id } : r);
          }
          return [...prev, { ...roomData, id }];
        });
      });
    });

    // Subscribe to public rooms for explore section
    const publicRoomsRef = gun.get('rooms');
    publicRoomsRef.map().on((room: any, id: string) => {
      if (!room || !room.isDiscoverable) return;
      setPublicRooms(prev => {
        const exists = prev.find(r => r.id === id);
        if (exists) {
          return prev.map(r => r.id === id ? { ...r, ...room, id } : r);
        }
        return [...prev, { ...room, id }];
      });
    });

    return () => {
      roomsRef.map().off();
      publicRoomsRef.map().off();
    };
  }, [gun, address]);

  useEffect(() => {
    if (!gun || !selectedRoom) return;

    // Subscribe to room messages
    const messagesRef = gun.get(`rooms/${selectedRoom}/messages`);
    messagesRef.map().on((msg: any, id: string) => {
      if (!msg) return;
      
      // Get sender's name
      if (msg.sender) {
        gun.get('users').get(msg.sender).get('name').once((name: string) => {
          setMessages(prev => {
            const exists = prev.find(m => m.id === id);
            if (exists) {
              return prev.map(m => m.id === id ? { ...m, senderName: name } : m);
            }
            return [...prev, { ...msg, id, senderName: name }].sort((a, b) => a.timestamp - b.timestamp);
          });
        });
      }
    });

    return () => {
      messagesRef.map().off();
    };
  }, [gun, selectedRoom]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !selectedRoom || !newMessage.trim() || !address) return;

    const messageData = {
      content: newMessage,
      sender: address,
      timestamp: Date.now(),
    };

    // Add message to room
    gun.get(`rooms/${selectedRoom}/messages`).set(messageData);

    // Update room's last message
    gun.get('rooms').get(selectedRoom).get('lastMessage').put({
      content: newMessage,
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  const handleCreateRoom = (data: ChatCreationData) => {
    if (!gun || !address) return;

    const roomId = `${Date.now()}_${address}`;
    
    // Create new room
    gun.get('rooms').get(roomId).put({
      name: data.name,
      description: data.description,
      owner: address,
      memberCount: 1,
      createdAt: Date.now(),
      isDiscoverable: data.isDiscoverable
    });

    // Add room reference to user's rooms
    gun.get('users').get(address).get('rooms').get(roomId).put(true);

    setSelectedRoom(roomId);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!gun || !address) return;

    // Add room reference to user's rooms
    gun.get('users').get(address).get('rooms').get(roomId).put(true);

    // Increment member count
    gun.get('rooms').get(roomId).once((room: GroupRoom) => {
      gun.get('rooms').get(roomId).get('memberCount').put((room.memberCount || 0) + 1);
    });

    setSelectedRoom(roomId);
    setIsExploring(false);
  };

  const filteredRooms = rooms
    .filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.lastMessage?.timestamp || b.createdAt) - (a.lastMessage?.timestamp || a.createdAt));

  const filteredPublicRooms = publicRooms
    .filter(room => 
      !rooms.find(r => r.id === room.id) && // Don't show rooms user is already in
      (room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => (b.lastMessage?.timestamp || b.createdAt) - (a.lastMessage?.timestamp || a.createdAt));

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div className={styles.search}>
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {address && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className={styles.createButton}
                >
                  New Room
                </button>
              )}
              <button 
                onClick={() => setIsExploring(!isExploring)}
                className={`${styles.createButton} ${isExploring ? styles.selected : ''}`}
                style={{ background: isExploring ? '#1d4ed8' : undefined }}
              >
                {isExploring ? 'My Rooms' : 'Explore'}
              </button>
            </div>
          </div>

          {!isExploring ? (
            <div className={styles.list}>
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className={`${styles.item} ${selectedRoom === room.id ? styles.selected : ''}`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>{room.name}</span>
                    <div className={styles.badge}>{room.memberCount} members</div>
                  </div>
                  <p className={styles.itemDescription}>{room.description}</p>
                  {room.lastMessage && (
                    <div className={styles.itemDescription}>
                      {room.lastMessage.content.substring(0, 50)}
                      {room.lastMessage.content.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.exploreSection}>
              <div className={styles.exploreHeader}>
                <span className={styles.exploreTitle}>Public Rooms</span>
              </div>
              <div className={styles.exploreList}>
                {filteredPublicRooms.map(room => (
                  <div key={room.id} className={styles.exploreItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{room.name}</span>
                      <div className={styles.badge}>{room.memberCount} members</div>
                    </div>
                    <p className={styles.itemDescription}>{room.description}</p>
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      className={styles.joinButton}
                    >
                      Join Room
                    </button>
                  </div>
                ))}
                {filteredPublicRooms.length === 0 && (
                  <p className={styles.itemDescription}>No public rooms found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.content}>
        {selectedRoom ? (
          <>
            <div className={styles.messages}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.sender === address ? styles.sent : styles.received}`}
                >
                  {msg.sender !== address && (
                    <div className={styles.messageSender}>
                      {msg.senderName || msg.sender.slice(0, 8)}
                    </div>
                  )}
                  <div className={styles.messageContent}>{msg.content}</div>
                  <div className={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className={styles.inputArea}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className={styles.input}
              />
              <button type="submit" className={styles.button}>Send</button>
            </form>
          </>
        ) : (
          <div className={styles.placeholder}>
            <h2 className={styles.placeholderTitle}>Select a room to start chatting</h2>
            <p className={styles.placeholderText}>Join the conversation in public or token-gated rooms</p>
          </div>
        )}
      </div>

      <CreateChatModal
        type="group"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateRoom}
      />
    </div>
  );
};

export default GroupChat; 