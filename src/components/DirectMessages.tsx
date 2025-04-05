import React, { useState, useEffect, useRef } from 'react';
import { useGun } from '../contexts/GunContext';
import { useWallet } from '../contexts/WalletContext';
import { signGunPermit, PERMIT_TYPES } from '../utils/wallet';
import styles from './DirectMessages.module.css';

interface Message {
  from: string;
  to: string;
  text: string;
  timestamp: number;
}

interface Chat {
  address: string;
  lastMessage?: string;
  timestamp?: number;
  unread?: number;
}

const DirectMessages: React.FC = () => {
  const { gun, isAuthenticated } = useGun();
  const { address } = useWallet();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatAddress, setNewChatAddress] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gun || !address || !isAuthenticated) return;

    // Subscribe to user's chats
    const userChats = gun.get('users').get(address).get('chats');
    userChats.map().on((chat: any, chatId: string) => {
      if (!chat) return;
      setChats(prev => {
        const existing = prev.find(c => c.address === chatId);
        if (existing) {
          return prev.map(c => c.address === chatId ? { ...c, ...chat } : c);
        }
        return [...prev, { address: chatId, ...chat }];
      });
    });

    return () => {
      userChats.map().off();
    };
  }, [gun, address, isAuthenticated]);

  useEffect(() => {
    if (!gun || !address || !selectedChat || !isAuthenticated) return;

    // Subscribe to messages between current user and selected chat
    const chatId = [address, selectedChat].sort().join('-');
    const messagesRef = gun.get('messages').get(chatId);
    
    messagesRef.map().on((msg: any, key: string) => {
      if (!msg) return;
      setMessages(prev => {
        const existing = prev.find(m => m.timestamp === msg.timestamp);
        if (existing) return prev;
        return [...prev, msg].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return () => {
      messagesRef.map().off();
    };
  }, [gun, address, selectedChat, isAuthenticated]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !address || !selectedChat || !newMessage.trim() || !isAuthenticated) return;

    try {
      const chatId = [address, selectedChat].sort().join('-');
      const timestamp = Date.now();
      const messageData = {
        from: address,
        to: selectedChat,
        text: newMessage.trim(),
        timestamp
      };

      // Get permit for message
      const permit = await signGunPermit(address, 'MESSAGE', {
        chatId,
        timestamp,
        messageHash: btoa(messageData.text) // Simple hash for verification
      });

      // Save message with permit
      gun.get('messages').get(chatId).get(`${timestamp}`).put({
        ...messageData,
        permit
      });

      // Update last message in chat with permit
      const chatUpdate = {
        lastMessage: newMessage.trim(),
        timestamp,
        permit
      };

      gun.get('users').get(address).get('chats').get(selectedChat).put(chatUpdate);

      gun.get('users').get(selectedChat).get('chats').get(address).put({
        ...chatUpdate,
        unread: (chats.find(c => c.address === selectedChat)?.unread || 0) + 1
      });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gun || !newChatAddress.trim() || !address) return;

    try {
      const timestamp = Date.now();
      const permit = await signGunPermit(address, 'MESSAGE', {
        action: 'start_chat',
        with: newChatAddress,
        timestamp
      });

      // Add chat to user's chat list with permit
      gun.get('users').get(address).get('chats').get(newChatAddress).put({
        timestamp,
        permit
      });

      setSelectedChat(newChatAddress);
      setNewChatAddress('');
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Failed to start new chat. Please try again.');
    }
  };

  if (!address) {
    return <div className={styles.container}>Please connect your wallet to use DMs</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <form onSubmit={handleStartNewChat} className={styles.newChatForm}>
          <input
            type="text"
            value={newChatAddress}
            onChange={(e) => setNewChatAddress(e.target.value)}
            placeholder="Enter wallet address"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Start Chat</button>
        </form>
        <div className={styles.chatList}>
          {chats.map((chat) => (
            <div
              key={chat.address}
              className={`${styles.chatItem} ${selectedChat === chat.address ? styles.selected : ''}`}
              onClick={() => setSelectedChat(chat.address)}
            >
              <div className={styles.chatInfo}>
                <span className={styles.address}>{chat.address.slice(0, 8)}...{chat.address.slice(-4)}</span>
                <span className={styles.lastMessage}>{chat.lastMessage}</span>
              </div>
              {chat.unread && chat.unread > 0 && (
                <span className={styles.unread}>{chat.unread}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chatContainer}>
        {selectedChat ? (
          <>
            <div className={styles.messages}>
              {messages.map((message) => (
                <div
                  key={message.timestamp}
                  className={`${styles.message} ${message.from === address ? styles.sent : styles.received}`}
                >
                  <div className={styles.messageContent}>
                    {message.text}
                  </div>
                  <div className={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className={styles.messageForm}>
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
          <div className={styles.noChat}>Select a chat to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages; 