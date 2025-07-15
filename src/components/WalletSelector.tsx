import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from '../pages/Popup/DataTypes';
import { Dropdown } from './Dropdown';
import { ChevronDownIcon, ArrowUpRightIcon, ArrowDownRightIcon, WalletIcon } from './Icons';

// Wallet Selector Component
export const WalletSelector = ({ wallets, selectedWallet, onWalletChange }: {
  wallets: Wallet[];
  selectedWallet: Wallet;
  onWalletChange: (wallet: Wallet) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      trigger={
        <div className="wallet-selector wallet-selector-anim">
          <WalletIcon />
          <span className="wallet-name">{selectedWallet.name}</span>
          <ChevronDownIcon />
        </div>
      }
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="wallet-list">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => {
              onWalletChange(wallet);
              setIsOpen(false);
            }}
            className={`wallet-item wallet-item-anim ${selectedWallet.id === wallet.id ? 'selected' : ''}`}
            tabIndex={0}
            role="button"
            style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
          >
            <div className="wallet-name">{wallet.name}</div>
            <div className="wallet-address">{wallet.address}</div>
          </div>
        ))}
      </div>
    </Dropdown>
  );
};