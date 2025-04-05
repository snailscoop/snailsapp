import React, { useState } from 'react';
import styles from '../styles/TokenGating.module.css';

export interface TokenGatingRule {
  type: 'nft' | 'token';
  contract: string;
  mode: ('holding' | 'staking')[];
  minAmount: string;
  usdValue?: string; // Only for fungible tokens
}

interface TokenGatingConfigProps {
  onConfigChange: (rules: TokenGatingRule[]) => void;
  isOpen: boolean;
}

const AVAILABLE_TOKENS = [
  { symbol: 'STARS', address: 'stars1stars...' }, // Add actual STARS token address
  { symbol: 'SNAILS', address: 'stars1snails...' }, // Add actual SNAILS token address
];

export const TokenGatingConfig: React.FC<TokenGatingConfigProps> = ({
  onConfigChange,
  isOpen
}) => {
  const [rules, setRules] = useState<TokenGatingRule[]>([]);
  const [useNFT, setUseNFT] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [currentStep, setCurrentStep] = useState<'type' | 'contract' | 'amount' | 'mode'>('type');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [nftAddress, setNftAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [usdValue, setUsdValue] = useState('');
  const [modes, setModes] = useState<('holding' | 'staking')[]>([]);

  const handleTypeSelection = (type: 'nft' | 'token' | null) => {
    if (type === 'nft') setUseNFT(!useNFT);
    if (type === 'token') setUseToken(!useToken);
    
    if (useNFT || useToken) {
      setCurrentStep('contract');
    }
  };

  const handleContractSelection = () => {
    if (useNFT && !nftAddress) return;
    if (useToken && !selectedToken) return;
    setCurrentStep('amount');
  };

  const handleAmountSelection = () => {
    if (!amount) return;
    setCurrentStep('mode');
  };

  const handleModeSelection = (mode: 'holding' | 'staking') => {
    const newModes = modes.includes(mode) 
      ? modes.filter(m => m !== mode)
      : [...modes, mode];
    setModes(newModes);
  };

  const handleFinish = () => {
    const newRules: TokenGatingRule[] = [];
    
    if (useNFT) {
      newRules.push({
        type: 'nft',
        contract: nftAddress,
        mode: modes,
        minAmount: amount
      });
    }
    
    if (useToken) {
      newRules.push({
        type: 'token',
        contract: selectedToken,
        mode: modes,
        minAmount: amount,
        usdValue: usdValue || undefined
      });
    }
    
    onConfigChange(newRules);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      {currentStep === 'type' && (
        <div className={styles.step}>
          <h3>Select Token Gating Type</h3>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={useNFT}
              onChange={() => handleTypeSelection('nft')}
            />
            NFT Collection
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={useToken}
              onChange={() => handleTypeSelection('token')}
            />
            Fungible Token
          </label>
          {(useNFT || useToken) && (
            <button 
              onClick={() => setCurrentStep('contract')}
              className={styles.button}
            >
              Next
            </button>
          )}
        </div>
      )}

      {currentStep === 'contract' && (
        <div className={styles.step}>
          <h3>Configure Contracts</h3>
          {useNFT && (
            <div className={styles.input}>
              <label htmlFor="nft-address">NFT Collection Address</label>
              <input
                id="nft-address"
                type="text"
                value={nftAddress}
                onChange={(e) => setNftAddress(e.target.value)}
                placeholder="stars1..."
              />
            </div>
          )}
          {useToken && (
            <div className={styles.input}>
              <label htmlFor="token-select">Select Token</label>
              <select
                id="token-select"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="">Select a token</option>
                {AVAILABLE_TOKENS.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={handleContractSelection}
            className={styles.button}
            disabled={useNFT && !nftAddress || useToken && !selectedToken}
          >
            Next
          </button>
        </div>
      )}

      {currentStep === 'amount' && (
        <div className={styles.step}>
          <h3>Required Amount</h3>
          <div className={styles.input}>
            <label htmlFor="min-amount">Minimum Amount Required</label>
            <input
              id="min-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              placeholder="Enter amount"
            />
          </div>
          {useToken && (
            <div className={styles.input}>
              <label htmlFor="usd-value">USD Value (Optional)</label>
              <input
                id="usd-value"
                type="number"
                value={usdValue}
                onChange={(e) => setUsdValue(e.target.value)}
                min="0"
                placeholder="Enter USD value"
              />
            </div>
          )}
          <button 
            onClick={handleAmountSelection}
            className={styles.button}
            disabled={!amount}
          >
            Next
          </button>
        </div>
      )}

      {currentStep === 'mode' && (
        <div className={styles.step}>
          <h3>Access Mode</h3>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={modes.includes('holding')}
              onChange={() => handleModeSelection('holding')}
            />
            Holding
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={modes.includes('staking')}
              onChange={() => handleModeSelection('staking')}
            />
            Staking
          </label>
          <button 
            onClick={handleFinish}
            className={styles.button}
            disabled={modes.length === 0}
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenGatingConfig; 