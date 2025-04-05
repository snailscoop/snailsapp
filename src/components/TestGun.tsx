import React, { useEffect } from 'react';
import { useGun, getGunInstance } from '../contexts/GunContext';
import Gun from 'gun';

interface TestData {
  message: string;
  timestamp: number;
}

const TestGun: React.FC = () => {
  const { connectionState, stats } = useGun();
  const gun = getGunInstance();

  useEffect(() => {
    if (!gun) return;

    console.log('Gun instance:', gun);
    console.log('Connection state:', connectionState);
    console.log('Stats:', stats);

    // Test data storage
    try {
      const testRef = gun.get('test');
      testRef.put({
        message: 'Hello from Gun.js!',
        timestamp: Date.now()
      });

      // Subscribe to changes
      testRef.on((data: TestData) => {
        console.log('Test data updated:', data);
      });
    } catch (error) {
      console.error('Error testing Gun.js:', error);
    }
  }, [gun, connectionState, stats]);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Gun.js Test Component</h3>
      <p>Connection State: {connectionState}</p>
      <p>Messages Sent: {stats.messagesSent}</p>
      <p>Messages Received: {stats.messagesReceived}</p>
      <p>Last Message Time: {stats.lastMessageTime ? new Date(stats.lastMessageTime).toLocaleString() : 'Never'}</p>
    </div>
  );
};

export default TestGun; 