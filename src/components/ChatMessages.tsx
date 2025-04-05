import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useWallet } from '../contexts/WalletContext';
import styles from './ChatMessages.module.css';

interface MessageProps {
  message: {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
    type: 'text' | 'sticker' | 'game' | 'poll';
  };
  isOwnMessage: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isOwnMessage }) => {
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  if (message.type === 'poll') {
    const pollData = JSON.parse(message.text);
    return (
      <div className={`${styles.message} ${styles.poll} ${isOwnMessage ? styles.own : ''}`}>
        <div className={styles.pollQuestion}>{pollData.question}</div>
        <div className={styles.pollOptions}>
          {pollData.options.map((option: string, index: number) => (
            <button key={index} className={styles.pollOption}>
              {option}
            </button>
          ))}
        </div>
        <div className={styles.messageTime}>{time}</div>
      </div>
    );
  }

  if (message.type === 'sticker') {
    return (
      <div className={`${styles.message} ${styles.sticker} ${isOwnMessage ? styles.own : ''}`}>
        <div className={styles.stickerContent}>{message.text}</div>
        <div className={styles.messageTime}>{time}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${isOwnMessage ? styles.own : ''}`}>
      <div className={styles.messageContent}>{message.text}</div>
      <div className={styles.messageTime}>{time}</div>
    </div>
  );
};

const ChatMessages: React.FC = () => {
  const { messages, currentRoom, sendMessage } = useChat();
  const { address } = useWallet();
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const defaultStickers = ['👋', '👍', '❤️', '😊', '🎉'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleSendSticker = async (sticker: string) => {
    try {
      await sendMessage(sticker, 'sticker');
      setShowStickers(false);
    } catch (error) {
      console.error('Failed to send sticker:', error);
      alert(error instanceof Error ? error.message : 'Failed to send sticker');
    }
  };

  if (!currentRoom) {
    return (
      <div className={styles.noRoom}>
        Join a room to start chatting
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map(message => (
          <Message
            key={message.id}
            message={message}
            isOwnMessage={message.sender === address}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputArea}>
        {showStickers && (
          <div className={styles.stickerPicker}>
            {defaultStickers.map(sticker => (
              <button
                key={sticker}
                className={styles.stickerButton}
                onClick={() => handleSendSticker(sticker)}
              >
                {sticker}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <button
            type="button"
            className={styles.stickerToggle}
            onClick={() => setShowStickers(!showStickers)}
          >
            😊
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={styles.messageInput}
          />
          <button type="submit" className={styles.sendButton}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMessages; 