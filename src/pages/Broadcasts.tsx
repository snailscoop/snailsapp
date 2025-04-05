import React, { useState, useEffect, useRef } from 'react';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import styles from '../styles/ChatLayout.module.css';
import CreateChatModal, { ChatCreationData } from '../components/CreateChatModal';

interface BroadcastChannel {
  id: string;
  name: string;
  description: string;
  owner: string;
  subscriberCount: number;
  createdAt: number;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
  isDiscoverable?: boolean;
  isPrivate?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  timestamp: number;
}

const Broadcasts: React.FC = () => {
  const { gun } = useGun();
  const { address } = useWallet();
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!gun) return;
    
    // Subscribe to available channels
    const channelsRef = gun.get('broadcastChannels');
    channelsRef.map().on((channel: any, id: string) => {
      if (!channel) return;
      setChannels(prev => {
        const exists = prev.find(c => c.id === id);
        if (exists) {
          return prev.map(c => c.id === id ? { ...c, ...channel } : c);
        }
        return [...prev, { ...channel, id }];
      });
    });

    return () => {
      channelsRef.map().off();
    };
  }, [gun]);

  useEffect(() => {
    if (!gun || !selectedChannel) return;

    // Subscribe to channel messages
    const messagesRef = gun.get(`broadcastChannels/${selectedChannel}/messages`);
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

    // Update subscriber count
    if (address) {
      gun.get(`broadcastChannels/${selectedChannel}/subscribers`).get(address).put(true);
    }

    return () => {
      messagesRef.map().off();
    };
  }, [gun, selectedChannel, address]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !selectedChannel || !newMessage.trim() || !address) return;

    // Only channel owner can broadcast
    const channel = channels.find(c => c.id === selectedChannel);
    if (channel?.owner !== address) return;

    const messageData = {
      content: newMessage,
      sender: address,
      timestamp: Date.now(),
    };

    // Add message to channel
    gun.get(`broadcastChannels/${selectedChannel}/messages`).set(messageData);

    // Update channel's last message
    gun.get('broadcastChannels').get(selectedChannel).get('lastMessage').put({
      content: newMessage,
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  const handleCreateChannel = (data: ChatCreationData) => {
    if (!gun || !address) return;

    const channelId = `${Date.now()}_${address}`;
    
    // Create new broadcast channel
    gun.get('broadcastChannels').get(channelId).put({
      name: data.name,
      description: data.description,
      owner: address,
      subscriberCount: 1,
      createdAt: Date.now(),
      isDiscoverable: data.isDiscoverable,
      isPrivate: data.isPrivate
    });

    // Add creator as first subscriber
    gun.get(`broadcastChannels/${channelId}/subscribers`).get(address).put(true);

    setSelectedChannel(channelId);
  };

  const filteredChannels = channels
    .filter(channel => 
      channel.isDiscoverable !== false &&
      (channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => (b.lastMessage?.timestamp || b.createdAt) - (a.lastMessage?.timestamp || a.createdAt));

  const isOwner = selectedChannel ? channels.find(c => c.id === selectedChannel)?.owner === address : false;

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div className={styles.search}>
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            {address && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className={styles.createButton}
              >
                Create Channel
              </button>
            )}
          </div>

          <div className={styles.list}>
            {filteredChannels.map(channel => (
              <div
                key={channel.id}
                className={`${styles.item} ${selectedChannel === channel.id ? styles.selected : ''}`}
                onClick={() => setSelectedChannel(channel.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{channel.name}</span>
                  <div className={styles.badge}>{channel.subscriberCount} subscribers</div>
                </div>
                <p className={styles.itemDescription}>{channel.description}</p>
                {channel.lastMessage && (
                  <div className={styles.itemDescription}>
                    {channel.lastMessage.content.substring(0, 50)}
                    {channel.lastMessage.content.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        {selectedChannel ? (
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
            {isOwner && (
              <form onSubmit={sendMessage} className={styles.inputArea}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast a message..."
                  className={styles.input}
                />
                <button type="submit" className={styles.button}>Broadcast</button>
              </form>
            )}
          </>
        ) : (
          <div className={styles.placeholder}>
            <h2 className={styles.placeholderTitle}>Select a channel to view broadcasts</h2>
            <p className={styles.placeholderText}>Subscribe to channels to receive updates</p>
          </div>
        )}
      </div>

      <CreateChatModal
        type="broadcast"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  );
};

export default Broadcasts; 