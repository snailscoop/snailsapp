import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGun } from './GunContext';
import { useWallet } from './WalletContext';
import { signGunPermit, PERMIT_TYPES } from '../utils/wallet';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  isPremium: boolean;
  maxUsers: number;
  currentUsers: number;
  theme?: string;
  branding?: string;
  permit?: any;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  type: 'text' | 'sticker' | 'game' | 'poll';
  permit?: any;
}

interface ChatContextType {
  rooms: ChatRoom[];
  currentRoom: string | null;
  messages: Message[];
  isPremiumUser: boolean;
  createRoom: (name: string, description: string, isPremium: boolean) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (text: string, type?: Message['type']) => Promise<void>;
  startPoll: (question: string, options: string[]) => Promise<void>;
  vote: (pollId: string, option: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gun } = useGun();
  const { address } = useWallet();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Check premium status
  useEffect(() => {
    if (!gun || !address) return;

    const checkPremium = () => {
      gun.get('users').get(address).get('subscription').on((data) => {
        if (data) {
          const end = data.end;
          setIsPremiumUser(Date.now() < end);
        } else {
          setIsPremiumUser(false);
        }
      });
    };

    checkPremium();
  }, [gun, address]);

  // Subscribe to rooms
  useEffect(() => {
    if (!gun) return;

    gun.get('rooms').map().on((room: ChatRoom, id) => {
      if (room) {
        setRooms(prev => {
          const exists = prev.find(r => r.id === id);
          if (exists) {
            return prev.map(r => r.id === id ? { ...r, ...room } : r);
          }
          return [...prev, { ...room, id }];
        });
      }
    });
  }, [gun]);

  // Subscribe to messages in current room
  useEffect(() => {
    if (!gun || !currentRoom) return;

    gun.get('messages').get(currentRoom).map().on((message: Message, id) => {
      if (message) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === id);
          if (exists) {
            return prev.map(m => m.id === id ? { ...m, ...message } : m);
          }
          return [...prev, { ...message, id }].sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });
  }, [gun, currentRoom]);

  const createRoom = async (name: string, description: string, isPremium: boolean) => {
    if (!gun || !address) throw new Error('Not connected');
    if (isPremium && !isPremiumUser) throw new Error('Premium subscription required');

    const permit = await signGunPermit(address, 'MESSAGE', {
      action: 'create_room',
      name,
      timestamp: Date.now()
    });

    const room: ChatRoom = {
      id: `${Date.now()}-${address}`,
      name,
      description,
      createdBy: address,
      createdAt: Date.now(),
      isPremium,
      maxUsers: isPremium ? 200 : 100,
      currentUsers: 0,
      permit
    };

    gun.get('rooms').get(room.id).put(room);
  };

  const joinRoom = async (roomId: string) => {
    if (!gun || !address) throw new Error('Not connected');
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    if (room.currentUsers >= room.maxUsers) throw new Error('Room is full');
    if (room.isPremium && !isPremiumUser) throw new Error('Premium subscription required');

    const permit = await signGunPermit(address, 'MESSAGE', {
      action: 'join_room',
      roomId,
      timestamp: Date.now()
    });

    gun.get('rooms').get(roomId).get('users').get(address).put({
      joined: Date.now(),
      permit
    });

    setCurrentRoom(roomId);
  };

  const leaveRoom = () => {
    if (!gun || !address || !currentRoom) return;

    gun.get('rooms').get(currentRoom).get('users').get(address).put(null);
    setCurrentRoom(null);
    setMessages([]);
  };

  const sendMessage = async (text: string, type: Message['type'] = 'text') => {
    if (!gun || !address || !currentRoom) throw new Error('Not connected to room');

    const permit = await signGunPermit(address, 'MESSAGE', {
      action: 'send_message',
      roomId: currentRoom,
      timestamp: Date.now()
    });

    const message: Message = {
      id: `${Date.now()}-${address}`,
      text,
      sender: address,
      timestamp: Date.now(),
      type,
      permit
    };

    gun.get('messages').get(currentRoom).get(message.id).put(message);
  };

  const startPoll = async (question: string, options: string[]) => {
    if (!isPremiumUser) throw new Error('Premium subscription required');
    await sendMessage(JSON.stringify({ question, options }), 'poll');
  };

  const vote = async (pollId: string, option: string) => {
    if (!gun || !address || !currentRoom) throw new Error('Not connected to room');
    if (!isPremiumUser) throw new Error('Premium subscription required');

    const permit = await signGunPermit(address, 'MESSAGE', {
      action: 'vote',
      pollId,
      option,
      timestamp: Date.now()
    });

    gun.get('polls').get(pollId).get('votes').get(address).put({
      option,
      timestamp: Date.now(),
      permit
    });
  };

  const value = {
    rooms,
    currentRoom,
    messages,
    isPremiumUser,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    startPoll,
    vote
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider; 