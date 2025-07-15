import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from '../pages/Popup/DataTypes';
import { Dropdown } from './Dropdown';
import { ChevronDownIcon, ArrowUpRightIcon, ArrowDownRightIcon, WalletIcon, PlusIcon } from './Icons';
import './WalletSelector.css';

// Wallet Selector Component
export const WalletSelector = ({ wallets, selectedWallet, onWalletChange, onCreateWallet }: {
  wallets: Wallet[];
  selectedWallet: Wallet;
  onWalletChange: (wallet: Wallet) => void;
  onCreateWallet?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Defensive: treat falsy, non-array, or empty array as no wallets
  const walletList = Array.isArray(wallets) && wallets ? wallets.filter(Boolean) : [];
  console.warn('Wallet list length:', walletList.length, 'wallets:', wallets);

  return (
    <Dropdown
      trigger={
        <div className="wallet-selector wallet-selector-anim">
          <WalletIcon />
          <span className="wallet-name">{selectedWallet && selectedWallet.name ? selectedWallet.name : 'No Wallets'}</span>
          <ChevronDownIcon />
        </div>
      }
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="wallet-list">
        {(!walletList || walletList.length === 0) ? (
          <div
            className="wallet-item wallet-item-anim create-wallet"
            tabIndex={0}
            role="button"
            onClick={typeof onCreateWallet === 'function' ? onCreateWallet : undefined}
            style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
          >
            <PlusIcon />
            <div className="wallet-name">Create Wallet</div>
          </div>
        ) : (
          walletList.map((wallet) => (
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
          ))
        )}
      </div>
    </Dropdown>
  );
};