import React, { useState, useEffect, useRef } from 'react';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import styles from '../styles/ChatLayout.module.css';
import CreateChatModal, { ChatCreationData } from '../components/CreateChatModal';

interface DirectChat {
  id: string;
  name: string;
  description: string;
  participants: string[];
  createdAt: number;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
  isRead?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  timestamp: number;
}

const DirectMessages: React.FC = () => {
  const { gun } = useGun();
  const { address } = useWallet();
  const [chats, setChats] = useState<DirectChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!gun || !address) return;
    
    // Subscribe to user's direct chats
    const chatsRef = gun.get('users').get(address).get('directChats');
    chatsRef.map().on((chat: any, id: string) => {
      if (!chat) return;
      setChats(prev => {
        const exists = prev.find(c => c.id === id);
        if (exists) {
          return prev.map(c => c.id === id ? { ...c, ...chat } : c);
        }
        return [...prev, { ...chat, id }];
      });
    });

    return () => {
      chatsRef.map().off();
    };
  }, [gun, address]);

  useEffect(() => {
    if (!gun || !selectedChat) return;

    // Subscribe to chat messages
    const messagesRef = gun.get(`directChats/${selectedChat}/messages`);
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

    // Mark chat as read
    if (address) {
      gun.get(`directChats/${selectedChat}/readBy`).get(address).put(true);
    }

    return () => {
      messagesRef.map().off();
    };
  }, [gun, selectedChat, address]);

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !selectedChat || !newMessage.trim() || !address) return;

    const messageData = {
      content: newMessage,
      sender: address,
      timestamp: Date.now(),
    };

    // Add message to chat
    gun.get(`directChats/${selectedChat}/messages`).set(messageData);

    // Update chat's last message
    gun.get(`directChats/${selectedChat}`).get('lastMessage').put({
      content: newMessage,
      timestamp: Date.now()
    });

    setNewMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleCreateChat = async (data: ChatCreationData) => {
    if (!gun || !address) return;

    const chatId = `${Date.now()}_${address}`;
    
    // Create new direct chat
    gun.get('directChats').get(chatId).put({
      name: data.name,
      description: data.description,
      participants: [address],
      createdAt: Date.now(),
    });

    // Add chat reference to user's chats
    gun.get('users').get(address).get('directChats').get(chatId).put(true);

    setSelectedChat(chatId);
  };

  const filteredChats = chats
    .filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                placeholder="Search messages..."
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
                New Message
              </button>
            )}
          </div>

          <div className={styles.list}>
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`${styles.item} ${selectedChat === chat.id ? styles.selected : ''}`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{chat.name}</span>
                  {!chat.isRead && <div className={styles.badge}>New</div>}
                </div>
                <p className={styles.itemDescription}>{chat.description}</p>
                {chat.lastMessage && (
                  <div className={styles.itemDescription}>
                    {chat.lastMessage.content.substring(0, 50)}
                    {chat.lastMessage.content.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        {selectedChat ? (
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
              {isTyping && (
                <div className={`${styles.message} ${styles.received}`}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className={styles.inputArea}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className={styles.input}
              />
              <button type="submit" className={styles.button}>Send</button>
            </form>
          </>
        ) : (
          <div className={styles.placeholder}>
            <h2 className={styles.placeholderTitle}>Select a chat to start messaging</h2>
            <p className={styles.placeholderText}>Start private conversations with other users</p>
          </div>
        )}
      </div>

      <CreateChatModal
        type="dm"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChat}
      />
    </div>
  );
};

export default DirectMessages; 