import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SnailsPremiumCheck } from '../SnailsPremiumCheck';
import { WalletProvider } from '../../contexts/WalletContext';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the WalletContext
jest.mock('../../contexts/WalletContext', () => ({
  ...jest.requireActual('../../contexts/WalletContext'),
  useWallet: jest.fn()
}));

describe('SnailsPremiumCheck', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
    (global.fetch as jest.Mock).mockClear();
    // Reset the mock implementation
    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: null,
      isConnected: false
    }));
  });

  it('should show connect wallet message when not connected', () => {
    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );
    expect(screen.getByText('Connect your wallet to check premium status')).toBeInTheDocument();
  });

  it('should show loading state while checking status', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: 'stars1test...',
      isConnected: true
    }));

    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );

    expect(screen.getByText('Checking premium status...')).toBeInTheDocument();
  });

  it('should show premium status when user has NFTs', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('holders')) {
        return Promise.resolve({
          json: () => Promise.resolve({ total: 1 })
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ staked: 0 })
      });
    });

    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: 'stars1test...',
      isConnected: true
    }));

    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('⭐ Premium Member')).toBeInTheDocument();
      expect(mockOnStatusChange).toHaveBeenCalledWith(true);
    });
  });

  it('should show premium status when user is staking', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('stakers')) {
        return Promise.resolve({
          json: () => Promise.resolve({ staked: 100 })
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ total: 0 })
      });
    });

    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: 'stars1test...',
      isConnected: true
    }));

    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('⭐ Premium Member')).toBeInTheDocument();
      expect(mockOnStatusChange).toHaveBeenCalledWith(true);
    });
  });

  it('should show standard status when user has no NFTs and is not staking', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('holders')) {
        return Promise.resolve({
          json: () => Promise.resolve({ total: 0 })
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ staked: 0 })
      });
    });

    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: 'stars1test...',
      isConnected: true
    }));

    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Standard Member')).toBeInTheDocument();
      expect(mockOnStatusChange).toHaveBeenCalledWith(false);
    });
  });

  it('should show error message when API calls fail', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { useWallet } = require('../../contexts/WalletContext');
    useWallet.mockImplementation(() => ({
      address: 'stars1test...',
      isConnected: true
    }));

    render(
      <WalletProvider>
        <SnailsPremiumCheck onStatusChange={mockOnStatusChange} />
      </WalletProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to check premium status')).toBeInTheDocument();
    });
  });
}); 