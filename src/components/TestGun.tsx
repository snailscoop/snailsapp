import React, { useEffect } from 'react';
import { useGun } from '../contexts/GunContext';

const TestGun: React.FC = () => {
  const { gun, user, isConnected, connectionStatus } = useGun();

  useEffect(() => {
    if (!gun) return;

    console.log('Gun instance:', gun);
    console.log('Gun user:', user);
    console.log('Connection status:', connectionStatus);
    console.log('Is connected:', isConnected);

    // Test data storage
    try {
      const testRef = gun.get('test');
      testRef.put({
        message: 'Hello from Gun.js!',
        timestamp: Date.now()
      });

      // Subscribe to changes
      testRef.on((data) => {
        console.log('Test data updated:', data);
      });
    } catch (error) {
      console.error('Error testing Gun.js:', error);
    }
  }, [gun, user, isConnected, connectionStatus]);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Gun.js Test Component</h3>
      <p>Connection Status: {connectionStatus}</p>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>User Initialized: {user ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default TestGun; 