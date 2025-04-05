import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenGatingConfig } from '../TokenGatingConfig';

jest.mock('../TokenGatingConfig', () => {
  const actual = jest.requireActual('../TokenGatingConfig');
  return {
    ...actual,
    AVAILABLE_TOKENS: [
      { symbol: 'STARS', address: 'stars1stars...' },
      { symbol: 'SNAILS', address: 'stars1snails...' }
    ]
  };
});

const mockTokens = [
  { symbol: 'STARS', address: 'stars1stars...' },
  { symbol: 'SNAILS', address: 'stars1snails...' }
];

describe('TokenGatingConfig', () => {
  const mockOnConfigChange = jest.fn();
  
  beforeEach(() => {
    mockOnConfigChange.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(<TokenGatingConfig isOpen={false} onConfigChange={mockOnConfigChange} />);
    expect(screen.queryByText('Select Token Gating Type')).not.toBeInTheDocument();
  });

  it('should render initial step when isOpen is true', () => {
    render(<TokenGatingConfig isOpen={true} onConfigChange={mockOnConfigChange} />);
    expect(screen.getByText('Select Token Gating Type')).toBeInTheDocument();
  });

  it('should handle NFT configuration flow', () => {
    render(<TokenGatingConfig isOpen={true} onConfigChange={mockOnConfigChange} />);
    
    // Step 1: Select NFT
    fireEvent.click(screen.getByText('NFT Collection'));
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Enter NFT contract
    const nftInput = screen.getByPlaceholderText('stars1...');
    fireEvent.change(nftInput, { target: { value: 'stars1nft123' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 3: Enter amount
    const amountInput = screen.getByLabelText('Minimum Amount Required');
    fireEvent.change(amountInput, { target: { value: '1' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 4: Select modes
    fireEvent.click(screen.getByText('Holding'));
    fireEvent.click(screen.getByText('Finish'));
    
    expect(mockOnConfigChange).toHaveBeenCalledWith([{
      type: 'nft',
      contract: 'stars1nft123',
      mode: ['holding'],
      minAmount: '1'
    }]);
  });

  it('should handle token configuration flow', () => {
    render(<TokenGatingConfig isOpen={true} onConfigChange={mockOnConfigChange} />);
    
    // Step 1: Select Token
    fireEvent.click(screen.getByText('Fungible Token'));
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Select token from dropdown
    const tokenSelect = screen.getByRole('combobox');
    fireEvent.change(tokenSelect, { target: { value: mockTokens[0].address } });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 3: Enter amounts
    const amountInput = screen.getByLabelText('Minimum Amount Required');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    const usdInput = screen.getByLabelText('USD Value (Optional)');
    fireEvent.change(usdInput, { target: { value: '1000' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 4: Select modes
    fireEvent.click(screen.getByText('Staking'));
    fireEvent.click(screen.getByText('Finish'));
    
    expect(mockOnConfigChange).toHaveBeenCalledWith([{
      type: 'token',
      contract: mockTokens[0].address,
      mode: ['staking'],
      minAmount: '100',
      usdValue: '1000'
    }]);
  });

  it('should handle combined NFT and token configuration', () => {
    render(<TokenGatingConfig isOpen={true} onConfigChange={mockOnConfigChange} />);
    
    // Select both NFT and Token
    fireEvent.click(screen.getByText('NFT Collection'));
    fireEvent.click(screen.getByText('Fungible Token'));
    fireEvent.click(screen.getByText('Next'));
    
    // Configure contracts
    const nftInput = screen.getByPlaceholderText('stars1...');
    fireEvent.change(nftInput, { target: { value: 'stars1nft123' } });
    
    const tokenSelect = screen.getByRole('combobox');
    fireEvent.change(tokenSelect, { target: { value: mockTokens[0].address } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter amounts
    const amountInput = screen.getByLabelText('Minimum Amount Required');
    fireEvent.change(amountInput, { target: { value: '1' } });
    
    const usdInput = screen.getByLabelText('USD Value (Optional)');
    fireEvent.change(usdInput, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Select modes
    fireEvent.click(screen.getByText('Holding'));
    fireEvent.click(screen.getByText('Staking'));
    fireEvent.click(screen.getByText('Finish'));
    
    expect(mockOnConfigChange).toHaveBeenCalledWith([
      {
        type: 'nft',
        contract: 'stars1nft123',
        mode: ['holding', 'staking'],
        minAmount: '1'
      },
      {
        type: 'token',
        contract: mockTokens[0].address,
        mode: ['holding', 'staking'],
        minAmount: '1',
        usdValue: '10'
      }
    ]);
  });

  it('should validate required fields before proceeding', () => {
    render(<TokenGatingConfig isOpen={true} onConfigChange={mockOnConfigChange} />);
    
    // Step 1: Select Token
    fireEvent.click(screen.getByText('Fungible Token'));
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Try to proceed without selecting token
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    // Select token and proceed
    const tokenSelect = screen.getByRole('combobox');
    fireEvent.change(tokenSelect, { target: { value: mockTokens[0].address } });
    expect(nextButton).not.toBeDisabled();
  });
}); 